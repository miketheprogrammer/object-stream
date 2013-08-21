object-stream
=============

A Collection of node streams for working with objects.

Description
=============
If you have a need to transform individual objects through a stream. This module is for you. It simplifies removing keys/values, and transforming the object to meet any schema. Most of the function will support and object of any tree depth, as well as object with subobject that have arrays that have subobjects. This style of tranformation is normally very difficult with objects. This module hopes to simplify that by using a string path notation. 

By building a traversal tree of the object hierarchy, we can use the paths to apply functions.

Important use cases. Adapting new versions of schema to older versions of a schema. Such as:

````javascript

Mapping the new schema to the old, and vice versa.

old = {
  menu: {
      details: 'blah',
    },
  sections: {
    {},
    {},
    {}
  } 
}

new = {
  menu: {
      details: 'blah',
      keywords: 'blah',
      sections: [
          {},
          {},
          {}
        ] 
  } 
}
````
The above example from new TO old ( new ==> old )

Would imply we need to remove the key value pair for Keywords, and move the 'sections' up one level.

Using the API in this module, we could either use the inclusive 'Filter' stream or exclusive 'Exclude' stream
to remove 'keywords'.

We could then use the 'Mutate' stream to move sections up one level.

Filter
========

````javascript
var ObjectStream = require("object-transform-stream");

/*
This Config means, we want to keep x , x.y, x.y's children, y, y.b, y.b's children

A * denotes either any value, or any array. Its most important use is in iterating arrays, to remove subchildren.
and to include all children of an object in the operation.

In the following example, refer to 'data' as the original object going in, and buffer as the object coming out.

Use TAP we test whether or not the objects are the same.
*/
var config = ['x','x:y','x:y:*', 'y', 'y:b', 'y:b:*'];
var stream = ObjectStream.Transform.Filter(config);


         var data = 
             {
                 x:{
                     y:[1,2,3],
                     z:3
                 },
                 y:{
                     a:1,
                     b:{
                         c:1,
                         d:3
                     }
                 }
             }
         var buffer = undefined;
                  stream.on('data', function ( data ) {
             buffer = data;
         });
         stream.on('end', function() {
             t.same(
                 {x:{
                     y:[1,2,3]
                     },
                  y:{
                      b: {
                          c:1,
                          d:3
                      }
                  }
                 }, buffer);
         });
         stream.write(data);
         stream.end();

         
````
