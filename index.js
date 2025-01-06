const express = require('express')
const cors = require('cors')

const app = express();

const port = process.env.PORT || 2000

// middleware

app.use(cors())
app.use(express.json())


app.get('/',async(req,res)=>{
    res.send('server is running')
})

app.listen(port,()=>{
    console.log(`app is running on port ${port}`)
})