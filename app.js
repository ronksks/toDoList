//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
mongoose.connect("mongodb+srv://admin-ronksks:Test123@cluster0.80wja.mongodb.net/todolistDB");

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, " todo item has to have a text"],

  },
  //
  versionKey:false
});
const Item = mongoose.model("item", itemSchema);




const ass1 = new Item({
  name: "First ass"
});

const ass2 = new Item({
  name: "Second ass"
});
const ass3 = new Item({
  name: "Third ass"
});
const defaultItems = [ass1, ass2, ass3];

const listSchema = {
  name: String,
  items: [itemSchema]
};
const List = mongoose.model("List", listSchema);


// Item.deleteMany({},function(err){
//   if(err){
//     console.log(err);
//   }else{
//     console.log("all is deleted");
//   }
// })

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
    if (err) {
      console.log(err);
    } else {
      // add default items only at the first time running
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function(err) {
          if (err) {
            console.log(err);
          } else
            console.log("default items inserted succsefuly");
        });
        //redirect to homepage and render the items
        res.redirect("/");
      } else {
        res.render("list", {
          listTitle: "Today",
          newListItems: foundItems
        }); // end render
      } //end else
    }; //end else
  }); //end Item.find
}); // end app.get

function createNewItem(itemName) {
  const item = new Item({
    name: itemName
  });
  item.save();
};


function removeById(idToRemove) {
  Item.findByIdAndRemove(idToRemove, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log( "Item has succssfuly removed");
    }
  });
}

app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if (listName === "Today") {
    item.save();
    console.log(itemName + " added");
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
});
app.post("/delete", function(req, res) {
  const checkdItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    removeById(checkdItemId);
    console.log(listName);
    res.redirect("/");
  } else {
    // expenation for findOneAndUpdate function
    // we want to delete an item from a specific list (item from work list)
    //we will use the findOneAndUpdate func combined with the $pull mongoDB func
    // name : listName => first is the filter condition ( what do we want to find)
    // for the update we will use the $pull mongoDB func to remove object from DB
    // updates => $pull:{items:{_id:checkdItemId}}}
    //  look in the array:      items = Array name :
    // find the spicific id with value     {_id : value}
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkdItemId
        }
      }
    }, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    })
  }
});

// dynamioc express routing
app.get("/:listName", function(req, res) {

  const customListName = _.capitalize(req.params.listName);
  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        console.log("list added")
        res.redirect("/" + customListName);
      } else {
        //show exsisting list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        }); // end render
      } //end else
    } //end !err
  }); //end list.find
}); //end app.get


app.get("/about", function(req, res) {
  res.render("about");
});


app.listen(process.env.PORT, function() {
  console.log("Server has started on port 3000");
});

// let port = process.env.PORT;
// if (port == null || port == "") {
//   port = 3000;
// }
// app.listen(port);

// app.listen(port, function() {
//   console.log("Server has started on port 3000");
// });
