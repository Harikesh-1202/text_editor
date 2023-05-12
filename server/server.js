const cors = require('cors');
const express = require('express');
const app = express();
const mongoose = require('mongoose')
const Document = require('./Document')

mongoose.connect("(MongDB-ConnectionLink)/test", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,


}, () => {
    console.log('Connected to MongoDB');
})

app.use(cors);
const io = require('socket.io')(3005, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: "Access-Control-Allow-Origin"

    },
})

const defaultValue = ""

io.on("connection", socket => {
    socket.on("get-document", async documentId => {
        const document = await findOrCreateDocument(documentId)
        socket.join(documentId)
        socket.emit("load-document", document.data)

        socket.on("send-changes", delta => {
            socket.broadcast.to(documentId).emit("receive-changes", delta)
        })

        socket.on("save-document", async data => {
            await Document.findByIdAndUpdate(documentId, { data })
        })
    })
})

async function findOrCreateDocument(id) {
    if (id == null) return

    const document = await Document.findById(id)
    if (document) return document
    return await Document.create({ _id: id, data: defaultValue })
}
