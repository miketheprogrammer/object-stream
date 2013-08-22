var test = require('tap').test;
var ObjectStream = require('../index');

test('SimplePassThroughArray', function( t ) {
    var s = new ObjectStream.PassThrough.Each;
    var data = ['a','b','c','d'];
    var buffer = []
    s.on('data', function( d ) {
        buffer.push(d);
    });

    s.on('end', function( ) {
        t.same(buffer, data);
        t.end();
    });
    s.write(data);
    s.end();
});

test('SimplePassThroughObject', function( t ) {
    var s = new ObjectStream.PassThrough.Each;
    var data = {x:1, y:2}
    buffer = undefined
    s.on('data', function( d ) {
        buffer = d;
    });

    s.on('end', function( ) {
        t.same(buffer, data);
        t.end();
    });
    s.write(data);
    s.end();
});


test('Using Exclude We should be able to configure complex Objects',
     function(t) {
         var config = ['x.y.*', 'y.b'];
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
         var stream = ObjectStream.Transform.Exclude(config);
         stream.on('data', function ( data ) {
             buffer = data;
             console.log('Hello',buffer);
         });
         stream.on('end', function() {
             t.same(
                 {x:{
                     y:[],
                     z:3},
                  y:{
                      a:1
                  }
                 }, buffer);
         });
         stream.write(data);
         stream.end();
         t.end();

     });

test('Using Filter We should be able to configure complex Objects',
     function(t) {
         var config = ['x','x.y','x.y.*', 'y', 'y.b', 'y.b.*'];
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
         var stream = ObjectStream.Transform.Filter(config);

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
         t.end();

     });


test('Using KeyMap we should be able to replace and objects keys',
     function(t) {
         var from = ['x','y','z.x','z.y', 'z', 'temp.*.b', 'temp'];
         var to = ['a','b','1','2','c','name','permanent'];
         var data = 
             {
                 x:'hello',
                 y:'world',
                 z:{
                     x:'Awesome',
                     y:'Work'
                 },
                 temp: [
                     {b:'michael'},
                     {b:'john'},
                 ]

             }
         var buffer = undefined;
         var stream = ObjectStream.Transform.KeyMap(from,to);

         stream.on('data', function ( data ) {
             buffer = data;
             
         });
         stream.on('end', function() {
             console.log("FINAL:", buffer);
             t.same({
                 a:'hello',
                 b:'world',
                 c: {
                     '1':'Awesome',
                     '2':'Work'
                 },
                 permanent: [
                     {name:'michael'},
                     {name:'john'}
                 ]
                 
             }, buffer);

         });
         stream.write(data);
         stream.end();
         t.end();

     });


test('Together the streams should be pipeable and work',
     function(t) {
         var exclude_config = ['x'];
         var filter_config = ['z','z.*', 'mutate', 'mutate.*','mutate.*.*'];
         var from = ['z.x','z.y', 'z','mutate.*._rev'];
         var to = ['1','2','c', '_id'];


         var data = 
             {
                 x:'hello',
                 y:'world',
                 z:{
                     x:'Awesome',
                     y:'Work'
                 },
                 mutate: [
                     {_rev:'1'},
                     {_rev:'2'}
                 ]

             }
         var buffer = undefined;

         var exclude_stream = ObjectStream.Transform.Exclude(exclude_config);
         var filter_stream = ObjectStream.Transform.Filter(filter_config);
         var keymap_stream = ObjectStream.Transform.KeyMap(from,to);

         keymap_stream.on('data', function ( data ) {
             buffer = data;
         });
         keymap_stream.on('end', function() {
             console.dir(buffer);
             t.same({
                 c: {
                     '1':'Awesome',
                     '2':'Work'
                 },
                 mutate: [
                     {_id:'1'},
                     {_id:'2'}
                 ]
             }, buffer);
             
             t.end();

         });

         exclude_stream.pipe(filter_stream).pipe(keymap_stream);

         exclude_stream.write(data);
         exclude_stream.end();
         

     });

test('Using Mutate we should be able to move key value pairs around',
     function(t) {
         var from = ['menu.sections'];
         var to = ['sections'];
         var data = 
             {
                 menu: {
                     details: "blah",
                     sections: [
                         {_id:1},
                         {_id:2}
                     ]
                 },
             }
         var buffer = undefined;
         var stream = ObjectStream.Transform.Mutate(from,to);

         stream.on('data', function ( data ) {
             buffer = data;
             
         });
         stream.on('end', function() {
             console.log("FINAL:", buffer);
             t.same({
                 menu: {
                     details:"blah"
                 },
                 sections: [
                         {_id:1},
                         {_id:2}
                     ]
             }, buffer);

         });
         stream.write(data);
         stream.end();
         t.end();
     });
/*
test("Using the following schema we should be able to Filter, Exclude, and Replace Keys", function( t ) {
    
    var data = {
        title: 'Michaels Palace of Food',
        desc: 'Awesomeness',
        footnode: 'Retribution will come',
        attributionImage: '/images/attr.jpg',
        attributionImageLink: 'www.google.com',
        entries: [
            {
                id: 1,
                type: 'section',
                orderNum: 1,
                title: 'section1',
                name: 'section1',
                desc:'blah',
            }
        ]
    }
    t.end();
});

*/