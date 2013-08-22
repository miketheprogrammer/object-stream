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

test("Using the following schema we should be able to Filter, Exclude, and Replace Keys", function( t ) {
    var exclude_config = [
        'attrbutionImage',
        'attributionImageLink',
        'entries.*.id'
    ]
    var filter_config = [
        'title',
        'desc',
        'entries',
        'entries.*',
        'entries.*.*',
        'attributes',
    ]
    var from = [
        'title',
        'desc',
        'entries.*.desc',
        'attributes.*.id'
    ]
    var to = [
        '_title',
        '_description',
        '_description',
        '_id',
    ]
    
    
    var exclude = ObjectStream.Transform.Exclude(exclude_config);
    var filter = ObjectStream.Transform.Filter(filter_config);
    var keymap = ObjectStream.Transform.KeyMap(from,to);
    
    var data = {
        title: 'Michaels Palace of Food',
        desc: 'Awesomeness',
        footnote: 'Retribution will come',
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
        ],
        attributes: {
            'x':1
        }
    }
    console.log("Original Data", data);

    exclude.pipe(filter).pipe(keymap);

    var buffer= undefined;
    t.plan(1);
    exclude.on('data', function ( data ) {
        buffer = data;
    });

    exclude.on('end', function() {
        console.dir(buffer);
        t.same(buffer, {
        _title: 'Michaels Palace of Food',
        _description: 'Awesomeness',
        entries: [
            {
                type: 'section',
                orderNum: 1,
                title: 'section1',
                name: 'section1',
                _description:'blah',
            }
        ], 
            attributes:{}
        });
    });

    exclude.write(data);
    exclude.end();
});

test('Using Setter we should be able to build an object',
     function(t) {
         var paths = ['id', 'obj', 'obj.id', 'obj.subobj', 'obj.subobj.array'];
         var values = [1, {}, 1, {}, [1,2,3,4]];
         var data = {};
         var buffer = undefined;
         var stream = ObjectStream.Transform.Setter(paths, values);

         stream.on('data', function ( data ) {
             buffer = data;
             
         });
         stream.on('end', function() {
             console.log("FINAL:", buffer);
             t.same({
                 id:1,
                 obj: {
                     id:1,
                     subobj:{
                         array:[
                             1,
                             2,
                             3,
                             4
                         ]
                     }
                 }
             }, buffer);

         });
         stream.write(data);
         stream.end();
         t.end();
     });


test('We should be able to use keymap with an object mapping',
     function(t) {
         var mapping = {
             'x':'a',
             'y':'b'
         }
         var data = 
             {
                 x:1,
                 y:2
             }
         var buffer = undefined;
         var stream = ObjectStream.Transform.KeyMap(mapping);

         stream.on('data', function ( data ) {
             buffer = data;
             
         });
         stream.on('end', function() {
             console.log("FINAL:", buffer);
             t.same({
                 a:1,
                 b:2
             }, buffer);

         });
         stream.write(data);
         stream.end();
         t.end();

     });

test('We should be able to use setter with an object mapping',
     function(t) {
         var mapping = {
             'id': 1,
             'obj': {},
             'obj.id': 1,
             'obj.subobj':{},
             'obj.subobj.array':[1,2,3,4]
         }
         var data = {};
         var buffer = undefined;
         var stream = ObjectStream.Transform.Setter(mapping);

         stream.on('data', function ( data ) {
             buffer = data;
             
         });
         stream.on('end', function() {
             console.log("FINAL:", buffer);
             t.same({
                 id:1,
                 obj: {
                     id:1,
                     subobj:{
                         array:[
                             1,
                             2,
                             3,
                             4
                         ]
                     }
                 }
             }, buffer);

         });
         stream.write(data);
         stream.end();
         t.end();
     });
