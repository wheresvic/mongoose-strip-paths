"use strict";

const objectPath = require("object-path");
const objectPathWithInheritedProps = objectPath.withInheritedProps;

const _ = require("underscore");
const mongoose = require("mongoose");

const mongooseStripPaths = function(schema, options) {
  const pathsToStrip = (options && options.paths) || [];

  const isMongooseDocument = function(doc) {
    if (doc instanceof mongoose.Document) {
      return true;
    }

    if (
      doc.constructor.name === "EmbeddedDocument" ||
      doc.constructor.name === "Document" ||
      doc.constructor.name === "model"
    ) {
      return true;
    }

    return false;
  };

  const checkAndStripPathsOnDoc = function(doc) {
    if (isMongooseDocument(doc) && _.isFunction(doc.stripPaths)) {
      doc.stripPaths();
    }
  };

  const stripPathsOnEmbeddedDocs = function(doc) {
    _.keys(doc.schema.paths).forEach(function(path) {
      if (path === "_id" || path === "__v") {
        return;
      }

      let nestedDoc = objectPathWithInheritedProps.get(doc, path);

      if (nestedDoc) {
        if (nestedDoc instanceof Array) {
          nestedDoc.forEach(function(subDoc) {
            checkAndStripPathsOnDoc(subDoc);
          });
        } else {
          checkAndStripPathsOnDoc(nestedDoc);
        }
      }
    });

    return doc;
  };

  schema.methods.stripPaths = function() {
    let doc = this;

    for (let path of pathsToStrip) {
      if (path !== "_id" && path !== "__v") {
        doc.set(path, undefined);
      }
    }

    return stripPathsOnEmbeddedDocs(doc);
  };
};

module.exports.mongooseStripPaths = mongooseStripPaths;
