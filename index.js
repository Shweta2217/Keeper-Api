const express = require('express')
const app = express();
const { Deta } = require('deta');
const bodyParser = require('body-parser');
const cors = require('cors');
const md5 = require('md5');
const JWT = require('jsonwebtoken');
require('dotenv').config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
const deta = Deta(process.env.KEY); // configure your Deta project
const notesDb = deta.Base('Keeper_Notes');  // access your DB
const userDb = deta.Base('Kepper_User');


app.post('/login', async (req, res) => {
    try {
        const email = req.body.email;
        const insertedUser = await userDb.fetch({ "email": email });

        if (insertedUser.count !== 0) {
            const hash = insertedUser.items[0].hash;
            const password = md5(req.body.password);
            const email = insertedUser.items[0].email;
            if (hash === password) {
                const token = JWT.sign({ email: email }, process.env.SECRET);
                res.status(200).send({ token: token });
            }
            else res.status(400).json({ "message": "Wrong password!" });
        }
        else res.status(500).json({ "message": "User not found!" });

    } catch (error) {
        console.error("Internal Error: ", error);
        res.status(500).json({ "message": "Error occured while login!" });

    }
});

app.post('/Register', async (req, res) => {
    try {
        const email = req.body.email;
        const insertedUser = await userDb.fetch({ "email": email });

        if (insertedUser.count !== 0)
            res.status(200).send({ message: "Allready Registered with this email!" });
        else {
            const password = md5(req.body.password);
            const data = {
                name: req.body.name,
                email: req.body.email,
                hash: password
            }
            const insertedUser = await userDb.put(data);
            if (insertedUser) {
                res.status(200).json({ "message": "Registred!" });
            }

            else
                res.status(500).json({ "message": "Error while registring user!" });
        }
    } catch (error) {
        console.error("Internal Error: ", error);
        res.status(500).json({ "message": "Error while registring user!" });

    }
})

app.post('/note', async (req, res) => {
    try {
        const token = req.headers.token;    
        if (!token) res.status(400).send({ "message": "Token not provided" })
        else {
            const {email} = JWT.verify(token, process.env.SECRET);
            
            const data = {
                email,
                title: req.body.title,
                content: req.body.content
            }
            const insertedData = await notesDb.put(data);
            if (insertedData)
                res.status(200).json({ "message": "Save to database successfully" });
            else
                res.status(500).json({ "message": "error while saving notes" });
        }
    } catch (error) {
        console.log("Internal Error : ", error.message);
        res.status(500).json({ "message": "error while saving notes!" });
    }
});


app.get('/notes', async (req, res) => {
    try {
        const token = req.headers.token;
        if (!token) res.send([]);
        else {
            const { email } = JWT.verify(token, process.env.SECRET);
            const notes = await notesDb.fetch({ email });
            if (notes)
                res.status(200).send(notes)
            else
                res.status(500).json({ "message": "Unable to fetch notes!" });
        }
    } catch (error) {
        console.error("Error while fetching notes : ", error);
        res.status(500).json({ "message": "Unable to fetch notes!" });
    }
});


app.delete('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await notesDb.delete(id);        
        res.status(200).json({ "message": "Deleted sucessfully" });
        
    } catch (error) {
        console.error("Internal Error: ", error);
        res.status(500).json({ "message": "Error while deleting notes!" });

    }
});

app.listen(5500, () => {
    console.log("Listning on port 5500");
});

// export 'app'
module.exports = app;