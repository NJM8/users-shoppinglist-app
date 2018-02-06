const express = require('express');
const router = express.Router({mergeParams: true});
const db = require('../models');
const authMiddleware = require('../middleware/auth');

router
  .route('/newItem')
  // GET /uses/:user_id/items/newItem - this route will display a form to enter a new item
  .get(authMiddleware.ensureCorrectUser, (req, res, next) => {
    db.User.findById(req.params.user_id).then(user => {
      res.render('addItem', { user });
    }).catch(err => {
     return next(err);
    });
  })
  // POST /users/:user_id/items/newItem - This route will add a new item to the db with a ref to owner and redirect back to the users page
  .post(authMiddleware.ensureCorrectUser, (req, res, next) => {
    let newItem = new db.Item(req.body);
    let userId = req.params.user_id;
    newItem.user = userId;
    return newItem.save().then(item => {
      return db.User.findByIdAndUpdate(userId, { $addToSet: { items:item.id } }).then(user => {
          return res.redirect(`/users/${user.id}`);
        }).catch(err => {
          return next(err);
        });
      }).catch(err => {
        return next(err);
      });     
  })

router
  .route('/editItem/:item_id')
  // GET /users/:user_id/items/editItem/:item_id - This route will display a form to edit the selected item
  .get(authMiddleware.ensureCorrectUser, (req, res, next) => {
    return db.Item.findById(req.params.item_id).populate('user').exec().then(item => {
      res.render('editItem', { item });
    }).catch(err => {
      return next(err);
    });
  })
  // PATCH /users/:user_id/items/editItem/:item_id - This route will update the selected item, then return back to the users page
  .patch(authMiddleware.ensureCorrectUser, (req, res, next) => {
    db.Item.findByIdAndUpdate(req.params.item_id, { $set: { name: req.body.name, quantity: req.body.quantity }}).then(() => {
      return res.redirect(`/users/${req.params.user_id}`);
    }).catch(err => {
      return next(err);
    });
  })
  // DELETE /users/:user_id/items/deleteItem/:item_id - This route will deleted the item and return back to the users page
  .delete(authMiddleware.ensureCorrectUser, (req, res, next) => {
    return db.User.findByIdAndUpdate(req.params.user_id, { $pull: { items: req.params.item_id }})
      .then(() => {
        db.Item.findByIdAndRemove(req.params.item_id).then(() => {
          return res.redirect(`/users/${req.params.user_id}`);
        }).catch(err => {
          return next(err);
        })
    }).catch(err => {
      return next(err);
    });
  });

  module.exports = router;




