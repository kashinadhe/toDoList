const express=require("express");
const app=express();
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const _=require("lodash");

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set("view engine","ejs"); /*Tells 'app' to use EJS as it's view engine*/ 

mongoose.connect("mongodb+srv://admin-kaustubh:Kashin12@cluster0.gf3u2.mongodb.net/todolistDB",{useNewUrlParser:true});

//ITEM SCHEMA
const itemsSchema=new mongoose.Schema({
    name:{
        type: String
    }
});

const Item=mongoose.model("Item",itemsSchema)

const item1=new Item({
    name: "Click + to add new item"
});

const item2=new Item({
    name: "<-- Press the checkbox to remove item"
});

const defaultItems=[item1,item2];
//----------------------------

//-----------------------------

//CUSTOM LIST SCHEMA
const customListSchema=new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});
const List=mongoose.model("List",customListSchema);

//------------------------------

app.get("/",function(req,res){
    Item.find(function(err,items){
        if(items.length===0){
            Item.insertMany(defaultItems,function(err){
                if(err){
                    console.log(err);
                }
                else{
                    console.log("Successfully inserted");
                }
            });
            res.redirect("/");
        }
        else{
            res.render("list",{listTitle: "Today",items: items});
        }
    });
});

app.post("/",function(req,res){
    let listName=req.body.listBtn; //returns value of listBtn i.e. current 'listTitle'
    let newItem=req.body.newItem;
    const item=new Item({
        name: newItem
    });
    if(listName==="Today"){ /*'Today' is root route's title name 
                            and we insert items in root route*/
        item.save();
        res.redirect("/"); 
    }
    else{ /*else the title i.e. listName is dynamic route entered by user*/ 
        List.findOne({name: listName},function(err,foundList){
            foundList.items.push(item);/*foundList is the object which has 
                                        schema called customListSchema in 
                                        which 'items' is the field that
                                         stores array of item objects*/
            foundList.save();
            res.redirect("/"+listName);
        });
    }
    
});

app.post("/delete",function(req,res){
    let deleteItemId=req.body.checkBox; /*Returns _id of an item after adding 'value=<%=items[i]._id%>'
                                        attribute to the checkbox input in list.ejs file*/
    let listName=req.body.listNameHiddenInputTag;
    if(listName==="Today"){
        Item.findByIdAndRemove(deleteItemId,function(err){
            if(err){
                console.log(err);
            }
            else{
                console.log("Deleted Successfully");
                res.redirect("/");
            }
        });
    }
    else{
        List.findOneAndUpdate({name: listName}, //condition para
            {$pull:{items:{_id: deleteItemId}}},/*update para in which we are 
                                                pulling out items with the help of id*/
            function(err,foundList){            //callback
            if(!err){
                res.redirect("/"+listName);
            }
        });
    }
    
});

app.get("/about",function(req,res){
    res.render("about");
});



app.get("/:customListName",function(req,res){
    let customListName=_.capitalize(req.params.customListName);//lodash capitalization
    /*Below code is to check whether the user enter same list 
    name so that the db does not insert the duplicate list name*/
    List.findOne({name:customListName},function(err,foundList){ /*foundList is the 
                                                                list that exists*/
        if(!err){
            if(!foundList){ //if list not exists then we add new list name in db
                const list=new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/"+customListName);
            }
            else{
                //If the list i.e. 'foundList' exists then we render the webpage
                res.render("list",{listTitle:customListName,items:foundList.items});
            }
        }
    });
    
});



app.listen(process.env.PORT || 3000,function(){
    console.log("Server Started");
});
