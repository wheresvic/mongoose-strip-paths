# mongoose-strip-paths

[![Build Status](https://travis-ci.org/victorparmar/mongoose-strip-paths.svg?branch=master)](https://travis-ci.org/victorparmar/mongoose-strip-paths) [![Coverage Status](https://coveralls.io/repos/github/victorparmar/mongoose-strip-paths/badge.svg?branch=master)](https://coveralls.io/github/victorparmar/mongoose-strip-paths?branch=master)

A mongoose plugin that deletes provided paths on a document and its sub documents, if any.

## How it works

When instantiated, this plugin adds a static method `stripPaths()` to your schema. Upon invoking this method, it loops over the provided paths in the `options.paths` variable and sets them to `undefined`. If there are any nested sub documents (via a single nested schema or embedded within an array), the `stripPaths()` method of all respective sub documents is also invoked. This works for nested subdocuments as well as documents added via a populate query.

Note that there will be no validation done upon invoking the `stripPaths()` method, which means that the document could be in an invalid state. 

This functionality should ideally only be used to return the document for further processing.

## Usage

For example, given schemas as follows:
```javascript
let mongoose                = require('mongoose');
let mongooseStripPaths      = require('mongoose-strip-paths').mongooseStripPaths;
let Schema                  = mongoose.Schema;

let PostSchema = new Schema({
  title: String, 
  message: String,
  fieldToStrip: String
});

PostSchema.plugin(mongooseStripPaths, {paths: ['fieldToStrip']});

let UserSchema = new Schema({
  username: String,
  createdAt: {type: Date, required: true},
  posts: [Post]
});

// note that if you add 'posts', then the posts field will be removed, 
// also note that after stripping 'createdAt' mongoose validation will fail on trying to save it
UserSchema.plugin(mongooseStripPaths, {paths: ['createdAt']}); 

let User = mongoose.model('User', UserSchema);
```

Calling the strip fields method on a user will result in the following document:
```javascript
let user = new User({
  username: 'u1',
  createdAt: new Date(),
  posts: []
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

user.stripPaths();

// user document is now
{
  _id: ...,
  username: 'u1',
  posts: [
    {
      _id: ...,
      title: 'first post',
      message: 'hello'
    },
    {
      _id: ...,
      title: 'second post',
      message: 'world'
    }
  ]
}
```

### Required options

- `path`: an array list of the required paths to remove. See [object-path](https://www.npmjs.com/package/object-path) api for more path notations.

## Requirements

- Node `>=4.4.7`
- MongoDB `>=2.6.10`
- Mongoose `>=4.0.0`

## Installation

`npm install mongoose-strip-paths`

## Testing

0. Install dependencies with `npm install` and [install mongo](http://docs.mongodb.org/manual/installation/) if you don't have it yet.
1. Start mongo with `mongod`.
2. Run tests with `npm test`. Additionally you can pass your own mongodb uri as an environment variable if you would like to test against your own database, for e.g. `URI='mongodb://username:password@localhost/mongoose-strip-paths-test' npm test`


## Misc

Issues, comments, PRs all welcome.
