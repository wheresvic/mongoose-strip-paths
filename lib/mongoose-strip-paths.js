'use strict';

const objectPath = require('object-path');
const objectPathWithInheritedProps = objectPath.withInheritedProps

const _ = require('underscore');

const mongooseStripPaths = function(schema, options) {

  const pathsToStrip = (options && options.paths) || [];

  const isMongooseDocument = function(doc) {
    return doc.constructor.name === 'EmbeddedDocument' || doc.constructor.name === 'Document' || doc.constructor.name === 'model';
  };

  const checkAndStripPathsOnDoc = function(doc) {
    if (isMongooseDocument(doc) && _.isFunction(doc.stripPaths)) {
      doc.stripPaths();
    }
  };

  const stripPathsOnEmbeddedDocs = function(doc) {
    _.keys(doc.schema.paths).forEach(function(path) {
      if (path === '_id' || path === '__v') {
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
  };

  schema.methods.stripPaths = function() {
    let doc = this;

    for (let path of pathsToStrip) {
      doc.set(path, undefined);
    }

    stripPathsOnEmbeddedDocs(doc);
  };

};

module.exports.mongooseStripPaths = mongooseStripPaths;
