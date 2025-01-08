const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken')

const app = express();

const port = process.env.PORT || 2000

// middleware

const corsOptions = {
  origin:['http://localhost:5173'],
  credentials:true,
  optionalSuccessStatus:200
}

app.use(cors(corsOptions))
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.92ej0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri)

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const artifactsInfo = client.db('artifactsInfo').collection('All_Artifacts')


    // generate jwt

    app.post('/jwt',async(req,res)=>{
      const email = req.body;
      // create token
      const token = jwt.sign(email,process.env.SECRET_KEY,{expiresIn:'6h'})
      console.log(token)
      res
      .cookie('token',token,{
        httpOnly:true,
        secure:process.env.NODE_ENV === 'production',
        sameSite:process.env.NODE_ENV === 'production' ? 'none' : 'strict'
      })
      .send({success:true})
    })

    // remove cookie 
    app.get('/logout',async(req,res)=>{
        res
        .clearCookie('token',{
          maxAge:0,
          secure:process.env.NODE_ENV === 'production',
          sameSite:process.env.NODE_ENV === 'production' ? 'none' : 'strict'
        })
        .send({success:true})
    })


    app.get('/featuredArtifacts',async(req,res)=>{
        const result = await artifactsInfo.find().sort({likeCount:-1}).limit(6).toArray();
        res.send(result)
    })

    // get all artifacts data api

    app.get('/allArtifacts',async(req,res)=>{
        const category = req.query.filter
        console.log(category)
        const search = req.query.search;
        console.log(search)
        let query = {artifactName:{$regex:search,$options:'i'}}
        if(category) query.artifactType = category
        const result = await artifactsInfo.find(query).toArray();
        res.send(result)
    })

  

    app.get('/artifactDetails/:id',async(req,res)=>{
        const id = req.params.id;
        const query = {_id:new ObjectId(id)}
        const result =await artifactsInfo.findOne(query)
        res.send(result)
    })

    // my added artifacts
    app.get('/myArtifacts/:email',async(req,res)=>{
        const email = req.params.email;
        const query = {adderEmail:email}
        const result = await artifactsInfo.find(query).toArray();
        res.send(result)
    })


    // delete artifacts data

    app.delete('/myArtifacts/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id:new ObjectId(id)}
            const result = await artifactsInfo.deleteOne(query)
            res.send(result)

    })

    // update artifacts data

    app.patch('/myArtifacts/:id',async(req,res)=>{
      const id = req.params.id;
      
      const data = req.body
      
      const query = {_id:new ObjectId(id)}
      const updatedDoc = {
        $set:data
      }
      const result = await artifactsInfo.updateOne(query,updatedDoc)
      
      res.send(result)
    })
    


   

    // add artifacts post api

    app.post('/allArtifacts',async(req,res)=>{
        const data = req.body;
        const result = await artifactsInfo.insertOne(data);
        res.send(result)
    })

    // increase like and decrease like count

      app.patch('/allArtifacts/:id',async(req,res)=>{
        const id = req.params.id
        const {userId} = req.body
        const likeStatus = req.query.likeStatus
        console.log(likeStatus)
        console.log(userId)
        
        const query = {_id:new ObjectId(id)}
        const artifactsData = await artifactsInfo.findOne(query)
       
        const updateDoc = {}
        if(likeStatus==='like'){
          if(artifactsData.likedBy &&  artifactsData.likedBy.includes(userId)){
            return res.status(400).send({message:'You already like this artifact'})
        }
            updateDoc.$inc={likeCount:1},
            updateDoc.$push={likedBy:userId}

            if(artifactsData.disLikedBy && artifactsData.disLikedBy.includes(userId)){
                updateDoc.$inc = {...updateDoc.$inc,disLikedCount:-1},
                updateDoc.$pull = {disLikedBy:userId}
            }
        }

        if(likeStatus === 'dislike'){
            if(artifactsData.disLikedBy && artifactsData.disLikedBy.includes(userId)){
              return res.status(400).send({message:'you already dislike this artifacts'})
            }

            updateDoc.$inc = {disLikedCount:1},
            updateDoc.$push = {disLikedBy:userId}

            if(artifactsData.likedBy && artifactsData.likedBy.includes(userId)){
                updateDoc.$inc = {...updateDoc.$inc,likeCount:-1},
                updateDoc.$pull = {likedBy:userId}
            }
        }


        const updateLikeCount = await artifactsInfo.updateOne(query,updateDoc)
        res.send(updateLikeCount)


      })

      // liked artifacts data

      app.get('/likedArtifacts/:userId',async(req,res)=>{
            const userId = req.params.userId
            const query = {likedBy:userId}
            const result = await artifactsInfo.find(query).toArray()
            res.send(result)
      })
    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/',async(req,res)=>{
    res.send('server is running')
})

app.listen(port,()=>{
    console.log(`app is running on port ${port}`)
})

// histoy_artifacts
// x29IIJDpYXheOGbC