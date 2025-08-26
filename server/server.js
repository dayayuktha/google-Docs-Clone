const mongoose = require("mongoose")
const Document = require("./Document")
const express = require("express")
const http = require("http")
const { Server } = require("socket.io")

const app = express()
const PORT = process.env.PORT || 3001

// Create HTTP server
const server = http.createServer(app)

// Attach Socket.IO to HTTP server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

// MongoDB connection
mongoose.connect("mongodb+srv://yuktha:yuktha123@cluster0.qprbajw.mongodb.net/google-docs-clone?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  writeConcern: { w: "majority" },
})

// Add connection event listeners
mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB Atlas')
})

mongoose.connection.on('error', (err) => {
  console.log('❌ MongoDB connection error:', err)
})

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Disconnected from MongoDB')
})

// ✅ Basic route so Render doesn't 404
app.get("/", (req, res) => {
  res.send("🚀 Google Docs Clone backend is running!")
})

console.log(`🚀 Server running on port ${PORT}`)
console.log('📡 Socket.io server ready for connections')

const defaultValue = ""

io.on("connection", socket => {
  console.log('👤 New client connected:', socket.id)
  
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

// ✅ Start server
server.listen(PORT, () => {
  console.log(`✅ Backend listening at http://localhost:${PORT}`)
})
