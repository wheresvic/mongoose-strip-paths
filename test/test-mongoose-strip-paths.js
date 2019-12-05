'use strict';

const expect = require('chai').expect;

const Promise = require('bluebird');
const mongoose = require('mongoose');
mongoose.Promise = Promise;
const Schema = mongoose.Schema;

const mongooseStripPaths = require('../lib/mongoose-strip-paths').mongooseStripPaths;

const uri = process.env.URI || 'mongodb://localhost/mongoose-strip-paths-test';

// setup schemas

let AddressSchema = new Schema({
  street: String,
  city: String
});

AddressSchema.plugin(mongooseStripPaths, { paths: ['street', '_id', '__v'] });

let PostSchema = new Schema({
  title: String,
  message: String,
  fieldToStrip: String
});

PostSchema.plugin(mongooseStripPaths, { paths: ['fieldToStrip'] });

let UserSchema = new Schema({
  username: String,
  createdAt: { type: Date, required: true },
  posts: [PostSchema],
  address: AddressSchema
});

// note that if you add 'posts', then the posts field will be removed, 
// also note that after stripping 'createdAt' mongoose validation will fail on trying to save it
UserSchema.plugin(mongooseStripPaths, { paths: ['createdAt'] });

let User = mongoose.model('User', UserSchema);

let UserGroupSchema = new Schema({
  users: [{ type: Schema.ObjectId, ref: 'User' }]
});

UserGroupSchema.plugin(mongooseStripPaths, { paths: [] });

let UserGroup = mongoose.model('UserGroup', UserGroupSchema);

// test harness

describe('mongoose-strip-paths plugin', () => {

  before(() => {
    return mongoose.connect(uri)
      .then(() => {
        return mongoose.connection.db.dropDatabase();
      });
  });

  after(() => {
    mongoose.connection.close()
  });

  describe('setup', () => {
    it('should not error when no options provided', () => {

      // given
      let RandomSchema = new Schema({
        field: String
      });

      // when
      RandomSchema.plugin(mongooseStripPaths);

      // then
      let Random = mongoose.model('Random', RandomSchema);
      let random = new Random({
        field: 'foo'
      });

      random.stripPaths();
    });
  });

  describe('statics', () => {
    it('should strip paths on object', () => {

      // given
      let user = new User({
        username: 'u1',
        createdAt: new Date(),
        posts: [],
        address: {
          street: '1 street',
          city: 'Montréal'
        }
      });

      user.posts.push({
        title: 'first post',
        message: 'hello',
        fieldToStrip: 'some internal data'
      });

      user.posts.push({
        title: 'second post',
        message: 'world',
        fieldToStrip: 'some more internal data'
      });

      // when
      let strippedUser = user.stripPaths();

      // then
      expect(strippedUser.createdAt).to.be.undefined;
      expect(strippedUser.posts[0].fieldToStrip).to.be.undefined;
      expect(strippedUser.posts[1].fieldToStrip).to.be.undefined;
      expect(strippedUser.address.street).to.be.undefined;

    });
  });


  describe('db', () => {
    it('should strip paths on a populated object', () => {

      // given
      let user = new User({
        username: 'u1',
        createdAt: new Date(),
        posts: [],
        address: {
          street: '1 street',
          city: 'Montréal'
        }
      });

      user.posts.push({
        title: 'first post',
        message: 'hello',
        fieldToStrip: 'some internal data'
      });

      user.posts.push({
        title: 'second post',
        message: 'world',
        fieldToStrip: 'some more internal data'
      });

      return user.save()
        .then(savedUser => {
          let userGroup = new UserGroup({
            users: [savedUser._id]
          });

          return userGroup.save();
        })
        .then(savedUserGroup => {
          return UserGroup.findById(savedUserGroup._id)
            .populate('users');
        })
        .then(foundUserGroup => {
          // when
          let ret = foundUserGroup.stripPaths();

          // then
          expect(ret.users[0].createdAt).to.be.undefined;
          expect(ret.users[0].posts[0].fieldToStrip).to.be.undefined;
          expect(ret.users[0].posts[1].fieldToStrip).to.be.undefined;
          expect(ret.users[0].address._id).to.not.be.undefined;
          expect(ret.users[0].address.__v).to.be.undefined;
          expect(ret.users[0].address.street).to.be.undefined;
        });
    });
  });

});
