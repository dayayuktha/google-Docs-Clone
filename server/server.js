const mongoose = require("mongoose")
const Document = require("./Document")

// Atlas connection string with your actual cluster URL
mongoose.connect("mongodb+srv://yuktha:yuktha123@cluster0.qprbajw.mongodb.net/google-docs-clone?retryWrites=true&w=majority&appName=Cluster0")

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

const io = require("socket.io")(3001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

console.log('🚀 Server running on port 3001')
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