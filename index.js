const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors=require('cors')
require('dotenv').config()
const app=express()
const port=process.env.PORT || 5000

app.use(express.json())
app.use(cors())


const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.2eupeky.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const jobsCollection=client.db('jobPortal').collection('jobsDB')
    const applyJobApplication=client.db('jobPortal').collection('apply')

    app.get('/jobs', async (req,res)=>{
        const email=req.query.email;
        let query={}
        if(email){
            query={email:email}
        }
        const getJobs=jobsCollection.find(query).limit(8)
        const result=await getJobs.toArray()
        res.send(result) 
    }) 
    app.get('/jobs/:id', async (req,res)=>{
        const id=req.params.id;
        const query={_id: new ObjectId(id)}
        const result=await jobsCollection.findOne(query)
        res.send(result)
    });

    app.post('/job-apply',async (req,res)=>{
        const sendApply=req.body;
        const result=await applyJobApplication.insertOne(sendApply)
        res.send(result)
    })
    app.get('/job-applyed', async (req,res)=>{
        const email=req.query.email;
        const query={applicant_email:email}
        const result=await applyJobApplication.find(query).toArray()
        for(const applyed of result){
            const query1={_id: new ObjectId(applyed.job_id)}
            const job=await jobsCollection.findOne(query1)
            if(job){
                applyed.title=job.title;
                applyed.company=job.company;
                applyed.company_logo=job.company_logo;
                applyed.location=job.location
                applyed.jobType=job.jobType
                applyed.category=job.category
            }

        }
        res.send(result)
    })

    app.delete('/job/:id', async (req,res)=>{
        const id=req.params.id;
        const query={_id: new ObjectId(id)}
        const result=await applyJobApplication.deleteOne(query)
        res.send(result)
    })

    app.get('/jobs/:id', async (req,res)=>{
        const id=req.params.id;
        const query={_id: new ObjectId (id)}
        const result=await jobsCollection.deleteOne(query)
        res.send(result)

    })
    app.post('/jobs', async (req, res) => {
        try {
            const postJob = req.body;
    
            const result = await jobsCollection.insertOne(postJob);
    
            const id = postJob.job_id; 
            const query = { _id: new ObjectId(id) }; 
            const job = await jobsCollection.findOne(query);
    
            let newCount = 0; 
    
            if (job?.jobApplicationCount) {
                newCount = job.jobApplicationCount + 1; 
            } else {
                newCount = 1;
            }
    
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    jobApplicationCount: newCount, 
                },
            };
    
            const updateResult = await jobsCollection.updateOne(filter, updateDoc);
    
            res.status(200).send({ result, updateResult }); 
        } catch (error) {
            console.error("Error in POST /jobs:", error);
            res.status(500).send({ message: "Internal Server Error", error }); 
        }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req,res)=>{
    res.send('this is my job portal server is runnig now')
})
app.listen(port, ()=>{
    console.log(`my job portal is running on ${port} `)
})


