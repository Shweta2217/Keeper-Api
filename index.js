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
    let email = req.body.email;
    const insertedUser = await userDb.fetch({ "email": email });
    if (insertedUser) {
        let hash = insertedUser.items[0].hash;
        let password = md5(req.body.password);
        let email = insertedUser.items[0].email;
        if (hash === password){
            let token = JWT.sign({email: email},process.env.SECRET)
            res.status(200).send({token: token });
        }
        else
            res.status(400).json({ "message": "Wrong password!" });
    }
    else
        res.status(500).json({ "message": "User not found!" });
});

app.post('/Register', async (req, res) => {
    let email = req.body.email;
    const insertedUser = await userDb.fetch({ "email": email });

    if (insertedUser.count !== 0)
        res.status(200).send({ message: "Allready Registered with this email!" });
    else {
        let password = md5(req.body.password);
        let data = {
            name: req.body.name,
            email: req.body.email,
            hash: password
        }
        const insertedUser = await userDb.put(data);
        if (insertedUser){
            let token = JWT.sign({email: email},process.env.SECRET)
            res.status(200).send({token:token, auth});
        }

        else
            res.status(500).json({ "message": "error while saving Notes" })
    }
})

app.post('/note', async (req, res) => {
    let data = {
        email: req.body.email,
        title: req.body.title,
        content: req.body.content
    }
    const insertedData = await notesDb.put(data);
    if (insertedData)
        res.status(200).json({ "message": "Save to data base successfully" });
    else
        res.status(500).json({ "message": "error while saving Notes" });

});


app.get('/notes', async (req, res) => {
    let token = req.headers.token;
    if (!token) res.send([]);
    else{
        let {email} = JWT.verify(token,process.env.SECRET);    
    const notes = await notesDb.fetch({email:email});
    if (notes)
        res.status(200).send(notes)
    else
        res.status(500).json({ "message": "Unable to fetch" })
    }
});


app.delete('/delete/:id', async (req, res) => {
    let id = req.params.id
    let deletedItem = await notesDb.delete(id);
    if (deletedItem)
        res.status(200).json({ "message": "Deleted sucessfully" });
    else
        res.status(500).json({ "message": "Error while deleting" });
});

app.listen(5500, () => {
    console.log("Listning");
});

// export 'app'
module.exports = app;