const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();

const db_password = process.env.DB_PASSWORD;
const db_username = process.env.DB_USERNAME

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
	`mongodb+srv://${db_username}:${db_password}@cluster0.sw99mbl.mongodb.net/todoListDB`
);

const itemsSchema = {
    name: String
}

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist"
});

const item2 = new Item({
	name: "Hit the plus button to add new item",
});

const item3 = new Item({
	name: "Add more items",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List", listSchema)


app.get("/", (req, res) => {

    Item.find({}, (err, foundItems) => {

        if(foundItems.length === 0){
            Item.insertMany(defaultItems, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully added items to the databsse");
                }
		});
        res.redirect("/");
        }
        else{
            res.render("list", { listTitle: "Today", newListItems: foundItems });
        }
    })
});

app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, (err, foundList) => {
        if(!err){
            if(!foundList){
                const list = new List({
                    name: customListName,
                    items: defaultItems,
                });
                list.save();
                res.redirect("/" + customListName)
            }else{
                res.render("list", {listTitle: foundList.name,newListItems: foundList.items});
            }
        }
    });

});

app.post("/", (req, res) => {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if(listName === "Today"){
        item.save();
	    res.redirect("/");
    }else{
        List.findOne({name: listName}, (err, foundList) => {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }

});

app.post("/delete", (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndDelete(checkedItemId, (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("Checked item is succesfully deleted");
                res.redirect("/");
            }
        });
    }else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
            if(err){
                console.log(err);
            }else{
                res.redirect("/" + listName);
            }
        });
    }

});


app.listen(3000, () => {
    console.log("Server started at port 3000");
    console.log("Press CTR + C to exit");
});