var Stream = require('stream');
var util = require('util');
var traverse = require('traverse');
/*
  Takes as input either an Object, or an Array.
  Outputs the object, or each object in the array
  individually.
*/
function PassThroughFilter ( ) {
    Stream.PassThrough.call(this);
}

util.inherits(PassThroughFilter, Stream.PassThrough);

PassThroughFilter.prototype.write = function( data ) {
    if (data instanceof Array)
        for ( var i=0; i<data.length; i++ )
            this.emit('data', data[i]);
    else this.emit('data', data);
}

var Stream = require('stream')

// through
//
// a stream that does nothing but re-emit the input.
// useful for aggregating a series of changing but not ending streams into one stream)

exports = module.exports = through
through.through = through

//create a readable writable stream.

function through (write, end, bind, opts) {
    write = write || function (data) { this.queue(data) }
    end = end || function () { this.queue(null) }
    var ended = false, destroyed = false, buffer = [], _ended = false
    var stream = new Stream()
  stream.readable = stream.writable = true
  stream.paused = false
    stream.bind = bind;

//  stream.autoPause   = !(opts && opts.autoPause   === false)
    stream.autoDestroy = !(opts && opts.autoDestroy === false)

    stream.write = function (data) {
        write.call(this, data)
    return !stream.paused
    }

    function drain() {
        while(buffer.length && !stream.paused) {
            var data = buffer.shift()
            if(null === data)
                return stream.emit('end')
      else
          stream.emit('data', data)
        }
    }

    stream.queue = stream.push = function (data) {
//    console.error(ended)
        if(_ended) return stream
        if(data == null) _ended = true
        buffer.push(data)
        drain()
    return stream
    }

  //this will be registered as the first 'end' listener
  //must call destroy next tick, to make sure we're after any
  //stream piped from here.
  //this is only a problem if end is not emitted synchronously.
  //a nicer way to do this is to make sure this is the last listener for 'end'

    stream.on('end', function () {
    stream.readable = false
        if(!stream.writable && stream.autoDestroy)
            process.nextTick(function () {
                stream.destroy()
            })
    })

    function _end () {
    stream.writable = false
        end.call(stream)
        if(!stream.readable && stream.autoDestroy)
            stream.destroy()
    }

    stream.end = function (data) {
        if(ended) return
    ended = true
        if(arguments.length) stream.write(data)
        _end() // will emit or queue
    return stream
    }

    stream.destroy = function () {
        if(destroyed) return
    destroyed = true
    ended = true
    buffer.length = 0
    stream.writable = stream.readable = false
        stream.emit('close')
    return stream
    }

    stream.pause = function () {
        if(stream.paused) return
    stream.paused = true
    return stream
    }

    stream.resume = function () {
        if(stream.paused) {
      stream.paused = false
            stream.emit('resume')
        }
        drain()
    //may have become paused again,
    //as drain emits 'data'.
        if(!stream.paused)
            stream.emit('drain')
    return stream
    }
  return stream
}


/*
  Takes an Array of configuration key mappings.
  i.e. ['_id', '_rev', 'name']

  For children use colons;
  i.e. ['person:name', 'person:child:name'

  If A key is an array the next key should be an asterisk
  i.e. ['person:children:*:name
*/
function Exclude( config, options ) {
    this._config = config;

}
//util.inherits(Exclude, Stream.Transform);

Exclude.prototype.write = function ( data ) {
    data = this._transform(data)
    this.emit('data', data ) ;
}

Exclude.prototype._validate = function ( path, match) {
    if ( match.length != path.length ) 
        return false;
    for ( var index in path ) {
        if ( path[index] != '*' )
            if ( path[index] != match[index] )
                return false;
    }

    return true;
}
Exclude.prototype.validate = function ( path, match ) {
    return this._validate( path, match );
}

Exclude.prototype._transform = function ( data ) {    
    var d_t = traverse(data);
    for ( var index in this._config ) {
        var key = this._config[index];
        var keys = key.split(':');
        var ref = this;
        d_t.forEach( function (v) {
            if ( ref.validate( keys, this.path ) ){
                try {
                    this.delete();
                } catch ( err ) {
                }
            }
        });

    }
    return d_t.value;
}

function Filter( config, options ) {
    this._config = config;

    Exclude.call(this, config);   
}
util.inherits(Filter, Exclude);

Filter.prototype._transform = function ( data ) {
    var d_t = traverse(data);
    var paths = [];
    for ( var index in this._config ) {
        var key = this._config[index];
        var keys = key.split(':');
        var ref = this;
        paths.push(keys);
    }    
    d_t.forEach( function (v) {
        var doDelete = false;
        
        for ( var index in paths ) {
            doDelete = doDelete || ref.validate( paths[index], this.path ) 
        }
        if ( !doDelete ) {
            if ( this.path.length != 0){
                this.delete();
            }
        }

    });

    return d_t.value;
}

function KeyMap ( from, to ) {

    this._from = from;
    this._to = to;
    Exclude.call(this);
}

util.inherits(KeyMap, Exclude);


var setKey = function (ps, value) {

    var node = this.value;
    for (var i = 0; i < ps.length - 1; i ++) {
        var key = ps[i];
        if (!hasOwnProperty.call(node, key)) node[key] = {};
        node = node[key];
    }
    var v = node[ps[i]];

    delete node[ps[i]];
    node[value] = v;
    return value;
};


KeyMap.prototype._transform = function( data ) {
    var d_t = traverse(data);
    var paths = {from:[], to:[]};
    for ( var index in this._from ) {
        var key = this._from[index];
        var keys = key.split(':');
        paths.from.push(keys);
    }
    paths.to = this._to;
    //console.log(paths);

    for ( var index in paths.from ) {
        var from = paths.from[index];
        var to = paths.to[index];
        
        setKey.call(d_t,from, to);

    }
    return d_t.value;
}

function get(cls, first, second) {
    var ins = new cls(first, second);
    console.dir(ins);
    var s = through( function write( data) {
        this.emit('data', this.bind._transform(data) );
    }, false, ins);
    return s;
}

exports.PassThrough = {};
exports.through = through;
exports.Transform = {};
exports.PassThrough.Each = PassThroughFilter;
exports.Transform.Exclude = function(first, second){
    return get(Exclude, first, second)
}
exports.Transform.Filter = function(first, second) {
    return get(Filter, first, second);
}
exports.Transform.KeyMap = function(first, second) {
    return get(KeyMap, first, second);
}