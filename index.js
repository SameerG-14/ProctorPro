const express =require("express");
const app = express();
const port=8080;
const mongoose =require("mongoose");
const method=require("method-override");                                // Form Contains Only two methods(get,post) ,but to make it convertable this package is reuired.
const Expresserror=require("./ExpressUserDefinedError")
const path=require("path");                                             // For Setting Deafult Paths
const ejsmate=require("ejs-mate");
const session = require("express-session");                             // To create seesion id for every user who browses our website (stores some imp inf in temprorary storage {ex:amazon cart})
const flash =require("connect-flash");                                  // To flash The Message Only once.
const passport=require("passport");                                     // Used For Authentication And Authorization.
const LocalStrategy=require("passport-local");                          // Startegy In Passport Used For Authentication. 
const testmodel=require("./models/Test");
const user=require("./models/user");
const isloggedin=require("./AuthenticationMiddleWare");

app.set("view engine","ejs");                                    // When The Response Is 'Rendered' default path to access.
app.set("views",path.join(__dirname,"/views"));               
app.use(express.static(path.join(__dirname,"/public")));         // Default middleware : for default paths.
app.use(express.urlencoded({extended:true}));                    // Default middleware : for get data sent from the request.
app.use(express.json());
app.use(method('_method'));
app.engine("ejs",ejsmate); 


main().then(()=>{                                                        // Since To Connect mongoDb To Backend (Server) is Asyncronous Process.                        
    console.log("DATA BASE CONNECTED SUCCESSFULLY..");               
})
.catch((err)=>{
    console.log(err);
})

async function main() {                                               // To Connect mongoDb To Backend (Server).
    
    await mongoose.connect("mongodb+srv://nischayhr11:Nischay1@cluster0.6p9g1.mongodb.net/Proctorpro?retryWrites=true&w=majority&appName=Cluster0");                                      // MongoDB URL.
}

const sessionoptions = {
    secret : "mysupersceretcode",
    resave : false,
    saveUninitialized:true,
    cookie :{

        expires : Date.now() + 7*24*60*60*1000,       // expiry of the session cookie.
        maxAge :  7*24*60*60*1000,
    }

}

app.use(session(sessionoptions));
app.use(flash());

app.use(passport.initialize());                      // Passport Used For Athentication.{ should be defined after Session Middle Ware.}
app.use(passport.session());
passport.use(new LocalStrategy(user.authenticate()));    // Do Not Miss The Brackets In user.authenticate It is a method!! {wasted 4 hours}
passport.serializeUser(user.serializeUser());                // To Store The User Data into the Session.
passport.deserializeUser(user.deserializeUser());            // To Remove The User Data From The Session.

app.use((req,res,next)=>{

    res.locals.success=req.flash("success");                // saves the success flash message to be printed, in browser storeage(treated like global variables). 
    res.locals.error=req.flash("error");                    // saves the error flash message to be printed, in browser storeage(treated like global variables).
    res.locals.curuser=req.user;                            // Storing Information of User For Automatic login after signUp. {locals == global variables}.
    next();
})

app.listen(port,(req,res)=>{

    console.log("server Started..");
});

app.get("/",(req,res)=>{

    res.render("./Test/index.ejs");
});

app.get("/test",isloggedin,(req,res)=>{

    res.render("./Test/createTest.ejs");
});

app.post("/test",async(req,res)=>{

    let test=req.body;
    let{testname,skill,testtype,time}=req.body;
    let d=await testmodel.create({name:testname , skills:skill ,type:testtype ,time:time});
    console.log(d);                                             
    res.redirect(`${d._id}/addquestions`);
});

app.get("/:id/addquestions",async(req,res)=>{

    let{id}=req.params;
    const test = await testmodel.findById(id);
    const questions=test.questions;
    console.log(questions);
    res.render("./Test/addquestion.ejs",{questions,id});
});



app.post("/:id/addquestions",async(req,res)=>{

    let{id}=req.params;
    let{title,choice1,choice2,choice3,choice4,answer}=req.body;
    const test = await testmodel.findById(id);
    const questions=test.questions;
    const q={
        title:title,
        options:[choice1,choice2,choice3,choice4],
        answer:answer
    }
    questions.push(q);
    test.save();
    console.log(test);
    res.render("./Test/addquestion.ejs",{questions,id});
});

app.post("/:id/deletequestion/:index", async (req, res) => {

    const { id, index } = req.params;
    
    try {
        // Find the test by ID
        const test = await testmodel.findById(id);
        
        // Remove the question at the specified index
        if (test && test.questions.length > index) {
            test.questions.splice(index, 1); // Remove the question at the specified index
            await test.save(); // Save the updated test
        }

        // Redirect back to the add questions page
        res.redirect(`/${id}/addquestions`);

    } catch (error) {
        console.error("Error deleting question:", error);
        res.status(500).send("An error occurred while deleting the question.");
    }
});


app.get("/:id/description",(req,res)=>{

    let {id}=req.params;

    res.render("./Test/description.ejs",{id});
});

app.get("/:id/generateLink",(req,res)=>{

    let {id}=req.params;
    res.render("./Test/generatelink.ejs",{id})
});

app.get("/instructions",isloggedin,(req,res)=>{

    res.render("./TestStart/instructions.ejs")
});

app.get("/testcamera/:id",(req,res)=>{
    
    let{id}=req.params;
    res.render("./TestStart/testcamera.ejs",{id})
});

app.get("/startTest",isloggedin,(req,res)=>{

    const number=1;
    res.render("./TestStart/index.ejs",{number});
});

app.get("/startTest/:id",isloggedin,async(req,res)=>{

    let{id}=req.params;
    const test = await testmodel.findById(id);
    const number=1;
    res.render("./TestStart/index.ejs",{number,test,id});
});

app.get("/startTest/:id/instructions",isloggedin,async(req,res)=>{

    let{id}=req.params;
    const test = await testmodel.findById(id);
    const number=1;
    res.render("./TestStart/instructions.ejs",{number,id,test});
});

app.post("/startTest/:id",async(req,res)=>{

     // Parse the number from the form
     let{id}=req.params;
     const test = await testmodel.findById(id);

     console.log(req.body)
     let number = parseInt(req.body.number, 10);

     // If number is NaN (undefined or invalid), start from 1
     if (isNaN(number)) {
         number = 1;  // Default to question 1 if there's an issue with the number
     } else {
         number += 1;  // Increment the number for the next question
     }

     if(number===test.questions.length){

        res.render("TestStart/testend.ejs", { number ,test,id});

     }else{

        // Render the template with the new question number
        res.render('TestStart/index.ejs', { number,id,test});
     }

});

app.get("/login",(req,res)=>{

    res.render("./user/login.ejs");
});

app.get("/signup",(req,res)=>{

    res.render("user/signup.ejs");
})

app.post("/signup",async(req,res,next)=>{

    try{

        let{username,email,password}=req.body;
        let curuser =new user({username:username,email:email});
        const registereduser=await user.register(curuser,password);
        console.log(registereduser);
        req.logIn(registereduser,(err)=>{     // Automatically Logins The User After SignUp.

            if(!email.endsWith("@gmail.com")){

                req.flash("error"," Enter  Valid  Email !!!");
                res.redirect("/signup");

            }else if(err){

                next(err);

            }else{

                req.flash("success",`Welcome To Roomzy , ${username}.....`);
                res.redirect("/");
            }
        });

    }catch(err){

        req.flash("error", "User Already Exsists With This Userame , Please Try Again.");
        res.redirect("/signup");
    }
});

app.get("/login",(req,res)=>{
    res.render("user/login.ejs");
});

app.post("/login",passport.authenticate("local",{ failureRedirect:'/login', failureFlash: true}),async(req,res)=>{    // automatically Authenticates The User.

        let{username}=req.body;
        req.flash("success",`Welcome Back To Roomzy '${username}' ,  You Are Logedin !!! ....`);
        res.redirect("/");
    }
);

app.get("/logout",(req,res,next)=>{

    let username=req.user.username;

    req.logout((err)=>{                    // For Loging Out The User.

        if(err){

            next(err);
        }else{

            req.flash("success",`'${username}' LoggedOut Successfully... `);
            res.redirect("/");
        }

    })
});

app.get("/endtest",(req,res)=>{

    res.render("./TestStart/endtest.ejs")
});

app.get("/suspicious",(req,res)=>{

    res.render("./TestStart/suspicious.ejs");
})

app.all("*",(req,res,next)=>{

    next(new Expresserror(404,"Page Not Found !!"));
});

app.use((err,req,res,next)=>{                                   // Error Handling MiddleWare.

    let{status=500,message="Something went wrong"}=err;
    res.status(status).send(message);
});

app.get("/suspicious", (req, res) => {
    // This is a placeholder response. You can render a view or send a JSON response as per your requirements.
    res.render(".TestStart/suspicious.ejs", { message: "Suspicious activity detected!" });  // Renders a view with a message
});

app.get("/endtest", (req, res) => {
    // This is a placeholder response. You can render a view or send a JSON response as per your requirements.
    res.render(".TestStart/endtest.ejs", { message: "Thank you for submitting the test" });  // Renders a view with a message
});

