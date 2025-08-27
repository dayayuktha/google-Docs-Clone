// server.js
require("dotenv").config();
const express = require("express")
const http = require("http")
const mongoose = require("mongoose")
const { Server } = require("socket.io")
const Document = require("./Document") // assuming you have a model
require("dotenv").config()

const app = express()
const server = http.createServer(app)

// ✅ Allow frontend both locally & from Vercel
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",  // vite default
      "http://localhost:3000",  // react default
      "https://google-docs-clone-lilac-rho.vercel.app", // replace with actual Vercel domain
    ],
    methods: ["GET", "POST"],
  },
})

// ✅ MongoDB connection with updated options
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB connection error:", err))

const defaultValue = ""

io.on("connection", socket => {
  console.log("New client connected")

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

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
