/* VIAT Client SDK - bundled (Rollup) */
import { keys, noValue, isPlainObject, hasValue, isBuffer as isBuffer$1, isU8, isUndefined, isFunction, isString, isNumber, isBoolean, isBigInt, isTypedArray, isMap, eachObject, isArray, eachArray, extendClass, assign } from '@universalweb/utilitylib';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var buffer$1 = {};

var base64Js = {};

var hasRequiredBase64Js;

function requireBase64Js () {
	if (hasRequiredBase64Js) return base64Js;
	hasRequiredBase64Js = 1;

	base64Js.byteLength = byteLength;
	base64Js.toByteArray = toByteArray;
	base64Js.fromByteArray = fromByteArray;

	var lookup = [];
	var revLookup = [];
	var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;

	var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	for (var i = 0, len = code.length; i < len; ++i) {
	  lookup[i] = code[i];
	  revLookup[code.charCodeAt(i)] = i;
	}

	// Support decoding URL-safe base64 strings, as Node.js does.
	// See: https://en.wikipedia.org/wiki/Base64#URL_applications
	revLookup['-'.charCodeAt(0)] = 62;
	revLookup['_'.charCodeAt(0)] = 63;

	function getLens (b64) {
	  var len = b64.length;

	  if (len % 4 > 0) {
	    throw new Error('Invalid string. Length must be a multiple of 4')
	  }

	  // Trim off extra bytes after placeholder bytes are found
	  // See: https://github.com/beatgammit/base64-js/issues/42
	  var validLen = b64.indexOf('=');
	  if (validLen === -1) validLen = len;

	  var placeHoldersLen = validLen === len
	    ? 0
	    : 4 - (validLen % 4);

	  return [validLen, placeHoldersLen]
	}

	// base64 is 4/3 + up to two characters of the original data
	function byteLength (b64) {
	  var lens = getLens(b64);
	  var validLen = lens[0];
	  var placeHoldersLen = lens[1];
	  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
	}

	function _byteLength (b64, validLen, placeHoldersLen) {
	  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
	}

	function toByteArray (b64) {
	  var tmp;
	  var lens = getLens(b64);
	  var validLen = lens[0];
	  var placeHoldersLen = lens[1];

	  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));

	  var curByte = 0;

	  // if there are placeholders, only get up to the last complete 4 chars
	  var len = placeHoldersLen > 0
	    ? validLen - 4
	    : validLen;

	  var i;
	  for (i = 0; i < len; i += 4) {
	    tmp =
	      (revLookup[b64.charCodeAt(i)] << 18) |
	      (revLookup[b64.charCodeAt(i + 1)] << 12) |
	      (revLookup[b64.charCodeAt(i + 2)] << 6) |
	      revLookup[b64.charCodeAt(i + 3)];
	    arr[curByte++] = (tmp >> 16) & 0xFF;
	    arr[curByte++] = (tmp >> 8) & 0xFF;
	    arr[curByte++] = tmp & 0xFF;
	  }

	  if (placeHoldersLen === 2) {
	    tmp =
	      (revLookup[b64.charCodeAt(i)] << 2) |
	      (revLookup[b64.charCodeAt(i + 1)] >> 4);
	    arr[curByte++] = tmp & 0xFF;
	  }

	  if (placeHoldersLen === 1) {
	    tmp =
	      (revLookup[b64.charCodeAt(i)] << 10) |
	      (revLookup[b64.charCodeAt(i + 1)] << 4) |
	      (revLookup[b64.charCodeAt(i + 2)] >> 2);
	    arr[curByte++] = (tmp >> 8) & 0xFF;
	    arr[curByte++] = tmp & 0xFF;
	  }

	  return arr
	}

	function tripletToBase64 (num) {
	  return lookup[num >> 18 & 0x3F] +
	    lookup[num >> 12 & 0x3F] +
	    lookup[num >> 6 & 0x3F] +
	    lookup[num & 0x3F]
	}

	function encodeChunk (uint8, start, end) {
	  var tmp;
	  var output = [];
	  for (var i = start; i < end; i += 3) {
	    tmp =
	      ((uint8[i] << 16) & 0xFF0000) +
	      ((uint8[i + 1] << 8) & 0xFF00) +
	      (uint8[i + 2] & 0xFF);
	    output.push(tripletToBase64(tmp));
	  }
	  return output.join('')
	}

	function fromByteArray (uint8) {
	  var tmp;
	  var len = uint8.length;
	  var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
	  var parts = [];
	  var maxChunkLength = 16383; // must be multiple of 3

	  // go through the array every three bytes, we'll deal with trailing stuff later
	  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
	    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
	  }

	  // pad the end with zeros, but make sure to not forget the extra bytes
	  if (extraBytes === 1) {
	    tmp = uint8[len - 1];
	    parts.push(
	      lookup[tmp >> 2] +
	      lookup[(tmp << 4) & 0x3F] +
	      '=='
	    );
	  } else if (extraBytes === 2) {
	    tmp = (uint8[len - 2] << 8) + uint8[len - 1];
	    parts.push(
	      lookup[tmp >> 10] +
	      lookup[(tmp >> 4) & 0x3F] +
	      lookup[(tmp << 2) & 0x3F] +
	      '='
	    );
	  }

	  return parts.join('')
	}
	return base64Js;
}

var ieee754 = {};

/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */

var hasRequiredIeee754;

function requireIeee754 () {
	if (hasRequiredIeee754) return ieee754;
	hasRequiredIeee754 = 1;
	ieee754.read = function (buffer, offset, isLE, mLen, nBytes) {
	  var e, m;
	  var eLen = (nBytes * 8) - mLen - 1;
	  var eMax = (1 << eLen) - 1;
	  var eBias = eMax >> 1;
	  var nBits = -7;
	  var i = isLE ? (nBytes - 1) : 0;
	  var d = isLE ? -1 : 1;
	  var s = buffer[offset + i];

	  i += d;

	  e = s & ((1 << (-nBits)) - 1);
	  s >>= (-nBits);
	  nBits += eLen;
	  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

	  m = e & ((1 << (-nBits)) - 1);
	  e >>= (-nBits);
	  nBits += mLen;
	  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

	  if (e === 0) {
	    e = 1 - eBias;
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity)
	  } else {
	    m = m + Math.pow(2, mLen);
	    e = e - eBias;
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
	};

	ieee754.write = function (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c;
	  var eLen = (nBytes * 8) - mLen - 1;
	  var eMax = (1 << eLen) - 1;
	  var eBias = eMax >> 1;
	  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
	  var i = isLE ? 0 : (nBytes - 1);
	  var d = isLE ? 1 : -1;
	  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

	  value = Math.abs(value);

	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0;
	    e = eMax;
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2);
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--;
	      c *= 2;
	    }
	    if (e + eBias >= 1) {
	      value += rt / c;
	    } else {
	      value += rt * Math.pow(2, 1 - eBias);
	    }
	    if (value * c >= 2) {
	      e++;
	      c /= 2;
	    }

	    if (e + eBias >= eMax) {
	      m = 0;
	      e = eMax;
	    } else if (e + eBias >= 1) {
	      m = ((value * c) - 1) * Math.pow(2, mLen);
	      e = e + eBias;
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
	      e = 0;
	    }
	  }

	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

	  e = (e << mLen) | m;
	  eLen += mLen;
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

	  buffer[offset + i - d] |= s * 128;
	};
	return ieee754;
}

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

var hasRequiredBuffer;

function requireBuffer () {
	if (hasRequiredBuffer) return buffer$1;
	hasRequiredBuffer = 1;
	(function (exports$1) {

		const base64 = requireBase64Js();
		const ieee754 = requireIeee754();
		const customInspectSymbol =
		  (typeof Symbol === 'function' && typeof Symbol['for'] === 'function') // eslint-disable-line dot-notation
		    ? Symbol['for']('nodejs.util.inspect.custom') // eslint-disable-line dot-notation
		    : null;

		exports$1.Buffer = Buffer;
		exports$1.SlowBuffer = SlowBuffer;
		exports$1.INSPECT_MAX_BYTES = 50;

		const K_MAX_LENGTH = 0x7fffffff;
		exports$1.kMaxLength = K_MAX_LENGTH;

		/**
		 * If `Buffer.TYPED_ARRAY_SUPPORT`:
		 *   === true    Use Uint8Array implementation (fastest)
		 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
		 *               implementation (most compatible, even IE6)
		 *
		 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
		 * Opera 11.6+, iOS 4.2+.
		 *
		 * We report that the browser does not support typed arrays if the are not subclassable
		 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
		 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
		 * for __proto__ and has a buggy typed array implementation.
		 */
		Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport();

		if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
		    typeof console.error === 'function') {
		  console.error(
		    'This browser lacks typed array (Uint8Array) support which is required by ' +
		    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
		  );
		}

		function typedArraySupport () {
		  // Can typed array instances can be augmented?
		  try {
		    const arr = new Uint8Array(1);
		    const proto = { foo: function () { return 42 } };
		    Object.setPrototypeOf(proto, Uint8Array.prototype);
		    Object.setPrototypeOf(arr, proto);
		    return arr.foo() === 42
		  } catch (e) {
		    return false
		  }
		}

		Object.defineProperty(Buffer.prototype, 'parent', {
		  enumerable: true,
		  get: function () {
		    if (!Buffer.isBuffer(this)) return undefined
		    return this.buffer
		  }
		});

		Object.defineProperty(Buffer.prototype, 'offset', {
		  enumerable: true,
		  get: function () {
		    if (!Buffer.isBuffer(this)) return undefined
		    return this.byteOffset
		  }
		});

		function createBuffer (length) {
		  if (length > K_MAX_LENGTH) {
		    throw new RangeError('The value "' + length + '" is invalid for option "size"')
		  }
		  // Return an augmented `Uint8Array` instance
		  const buf = new Uint8Array(length);
		  Object.setPrototypeOf(buf, Buffer.prototype);
		  return buf
		}

		/**
		 * The Buffer constructor returns instances of `Uint8Array` that have their
		 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
		 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
		 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
		 * returns a single octet.
		 *
		 * The `Uint8Array` prototype remains unmodified.
		 */

		function Buffer (arg, encodingOrOffset, length) {
		  // Common case.
		  if (typeof arg === 'number') {
		    if (typeof encodingOrOffset === 'string') {
		      throw new TypeError(
		        'The "string" argument must be of type string. Received type number'
		      )
		    }
		    return allocUnsafe(arg)
		  }
		  return from(arg, encodingOrOffset, length)
		}

		Buffer.poolSize = 8192; // not used by this implementation

		function from (value, encodingOrOffset, length) {
		  if (typeof value === 'string') {
		    return fromString(value, encodingOrOffset)
		  }

		  if (ArrayBuffer.isView(value)) {
		    return fromArrayView(value)
		  }

		  if (value == null) {
		    throw new TypeError(
		      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
		      'or Array-like Object. Received type ' + (typeof value)
		    )
		  }

		  if (isInstance(value, ArrayBuffer) ||
		      (value && isInstance(value.buffer, ArrayBuffer))) {
		    return fromArrayBuffer(value, encodingOrOffset, length)
		  }

		  if (typeof SharedArrayBuffer !== 'undefined' &&
		      (isInstance(value, SharedArrayBuffer) ||
		      (value && isInstance(value.buffer, SharedArrayBuffer)))) {
		    return fromArrayBuffer(value, encodingOrOffset, length)
		  }

		  if (typeof value === 'number') {
		    throw new TypeError(
		      'The "value" argument must not be of type number. Received type number'
		    )
		  }

		  const valueOf = value.valueOf && value.valueOf();
		  if (valueOf != null && valueOf !== value) {
		    return Buffer.from(valueOf, encodingOrOffset, length)
		  }

		  const b = fromObject(value);
		  if (b) return b

		  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
		      typeof value[Symbol.toPrimitive] === 'function') {
		    return Buffer.from(value[Symbol.toPrimitive]('string'), encodingOrOffset, length)
		  }

		  throw new TypeError(
		    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
		    'or Array-like Object. Received type ' + (typeof value)
		  )
		}

		/**
		 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
		 * if value is a number.
		 * Buffer.from(str[, encoding])
		 * Buffer.from(array)
		 * Buffer.from(buffer)
		 * Buffer.from(arrayBuffer[, byteOffset[, length]])
		 **/
		Buffer.from = function (value, encodingOrOffset, length) {
		  return from(value, encodingOrOffset, length)
		};

		// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
		// https://github.com/feross/buffer/pull/148
		Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype);
		Object.setPrototypeOf(Buffer, Uint8Array);

		function assertSize (size) {
		  if (typeof size !== 'number') {
		    throw new TypeError('"size" argument must be of type number')
		  } else if (size < 0) {
		    throw new RangeError('The value "' + size + '" is invalid for option "size"')
		  }
		}

		function alloc (size, fill, encoding) {
		  assertSize(size);
		  if (size <= 0) {
		    return createBuffer(size)
		  }
		  if (fill !== undefined) {
		    // Only pay attention to encoding if it's a string. This
		    // prevents accidentally sending in a number that would
		    // be interpreted as a start offset.
		    return typeof encoding === 'string'
		      ? createBuffer(size).fill(fill, encoding)
		      : createBuffer(size).fill(fill)
		  }
		  return createBuffer(size)
		}

		/**
		 * Creates a new filled Buffer instance.
		 * alloc(size[, fill[, encoding]])
		 **/
		Buffer.alloc = function (size, fill, encoding) {
		  return alloc(size, fill, encoding)
		};

		function allocUnsafe (size) {
		  assertSize(size);
		  return createBuffer(size < 0 ? 0 : checked(size) | 0)
		}

		/**
		 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
		 * */
		Buffer.allocUnsafe = function (size) {
		  return allocUnsafe(size)
		};
		/**
		 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
		 */
		Buffer.allocUnsafeSlow = function (size) {
		  return allocUnsafe(size)
		};

		function fromString (string, encoding) {
		  if (typeof encoding !== 'string' || encoding === '') {
		    encoding = 'utf8';
		  }

		  if (!Buffer.isEncoding(encoding)) {
		    throw new TypeError('Unknown encoding: ' + encoding)
		  }

		  const length = byteLength(string, encoding) | 0;
		  let buf = createBuffer(length);

		  const actual = buf.write(string, encoding);

		  if (actual !== length) {
		    // Writing a hex string, for example, that contains invalid characters will
		    // cause everything after the first invalid character to be ignored. (e.g.
		    // 'abxxcd' will be treated as 'ab')
		    buf = buf.slice(0, actual);
		  }

		  return buf
		}

		function fromArrayLike (array) {
		  const length = array.length < 0 ? 0 : checked(array.length) | 0;
		  const buf = createBuffer(length);
		  for (let i = 0; i < length; i += 1) {
		    buf[i] = array[i] & 255;
		  }
		  return buf
		}

		function fromArrayView (arrayView) {
		  if (isInstance(arrayView, Uint8Array)) {
		    const copy = new Uint8Array(arrayView);
		    return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength)
		  }
		  return fromArrayLike(arrayView)
		}

		function fromArrayBuffer (array, byteOffset, length) {
		  if (byteOffset < 0 || array.byteLength < byteOffset) {
		    throw new RangeError('"offset" is outside of buffer bounds')
		  }

		  if (array.byteLength < byteOffset + (length || 0)) {
		    throw new RangeError('"length" is outside of buffer bounds')
		  }

		  let buf;
		  if (byteOffset === undefined && length === undefined) {
		    buf = new Uint8Array(array);
		  } else if (length === undefined) {
		    buf = new Uint8Array(array, byteOffset);
		  } else {
		    buf = new Uint8Array(array, byteOffset, length);
		  }

		  // Return an augmented `Uint8Array` instance
		  Object.setPrototypeOf(buf, Buffer.prototype);

		  return buf
		}

		function fromObject (obj) {
		  if (Buffer.isBuffer(obj)) {
		    const len = checked(obj.length) | 0;
		    const buf = createBuffer(len);

		    if (buf.length === 0) {
		      return buf
		    }

		    obj.copy(buf, 0, 0, len);
		    return buf
		  }

		  if (obj.length !== undefined) {
		    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
		      return createBuffer(0)
		    }
		    return fromArrayLike(obj)
		  }

		  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
		    return fromArrayLike(obj.data)
		  }
		}

		function checked (length) {
		  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
		  // length is NaN (which is otherwise coerced to zero.)
		  if (length >= K_MAX_LENGTH) {
		    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
		                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
		  }
		  return length | 0
		}

		function SlowBuffer (length) {
		  if (+length != length) { // eslint-disable-line eqeqeq
		    length = 0;
		  }
		  return Buffer.alloc(+length)
		}

		Buffer.isBuffer = function isBuffer (b) {
		  return b != null && b._isBuffer === true &&
		    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
		};

		Buffer.compare = function compare (a, b) {
		  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength);
		  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength);
		  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
		    throw new TypeError(
		      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
		    )
		  }

		  if (a === b) return 0

		  let x = a.length;
		  let y = b.length;

		  for (let i = 0, len = Math.min(x, y); i < len; ++i) {
		    if (a[i] !== b[i]) {
		      x = a[i];
		      y = b[i];
		      break
		    }
		  }

		  if (x < y) return -1
		  if (y < x) return 1
		  return 0
		};

		Buffer.isEncoding = function isEncoding (encoding) {
		  switch (String(encoding).toLowerCase()) {
		    case 'hex':
		    case 'utf8':
		    case 'utf-8':
		    case 'ascii':
		    case 'latin1':
		    case 'binary':
		    case 'base64':
		    case 'ucs2':
		    case 'ucs-2':
		    case 'utf16le':
		    case 'utf-16le':
		      return true
		    default:
		      return false
		  }
		};

		Buffer.concat = function concat (list, length) {
		  if (!Array.isArray(list)) {
		    throw new TypeError('"list" argument must be an Array of Buffers')
		  }

		  if (list.length === 0) {
		    return Buffer.alloc(0)
		  }

		  let i;
		  if (length === undefined) {
		    length = 0;
		    for (i = 0; i < list.length; ++i) {
		      length += list[i].length;
		    }
		  }

		  const buffer = Buffer.allocUnsafe(length);
		  let pos = 0;
		  for (i = 0; i < list.length; ++i) {
		    let buf = list[i];
		    if (isInstance(buf, Uint8Array)) {
		      if (pos + buf.length > buffer.length) {
		        if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
		        buf.copy(buffer, pos);
		      } else {
		        Uint8Array.prototype.set.call(
		          buffer,
		          buf,
		          pos
		        );
		      }
		    } else if (!Buffer.isBuffer(buf)) {
		      throw new TypeError('"list" argument must be an Array of Buffers')
		    } else {
		      buf.copy(buffer, pos);
		    }
		    pos += buf.length;
		  }
		  return buffer
		};

		function byteLength (string, encoding) {
		  if (Buffer.isBuffer(string)) {
		    return string.length
		  }
		  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
		    return string.byteLength
		  }
		  if (typeof string !== 'string') {
		    throw new TypeError(
		      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
		      'Received type ' + typeof string
		    )
		  }

		  const len = string.length;
		  const mustMatch = (arguments.length > 2 && arguments[2] === true);
		  if (!mustMatch && len === 0) return 0

		  // Use a for loop to avoid recursion
		  let loweredCase = false;
		  for (;;) {
		    switch (encoding) {
		      case 'ascii':
		      case 'latin1':
		      case 'binary':
		        return len
		      case 'utf8':
		      case 'utf-8':
		        return utf8ToBytes(string).length
		      case 'ucs2':
		      case 'ucs-2':
		      case 'utf16le':
		      case 'utf-16le':
		        return len * 2
		      case 'hex':
		        return len >>> 1
		      case 'base64':
		        return base64ToBytes(string).length
		      default:
		        if (loweredCase) {
		          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
		        }
		        encoding = ('' + encoding).toLowerCase();
		        loweredCase = true;
		    }
		  }
		}
		Buffer.byteLength = byteLength;

		function slowToString (encoding, start, end) {
		  let loweredCase = false;

		  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
		  // property of a typed array.

		  // This behaves neither like String nor Uint8Array in that we set start/end
		  // to their upper/lower bounds if the value passed is out of range.
		  // undefined is handled specially as per ECMA-262 6th Edition,
		  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
		  if (start === undefined || start < 0) {
		    start = 0;
		  }
		  // Return early if start > this.length. Done here to prevent potential uint32
		  // coercion fail below.
		  if (start > this.length) {
		    return ''
		  }

		  if (end === undefined || end > this.length) {
		    end = this.length;
		  }

		  if (end <= 0) {
		    return ''
		  }

		  // Force coercion to uint32. This will also coerce falsey/NaN values to 0.
		  end >>>= 0;
		  start >>>= 0;

		  if (end <= start) {
		    return ''
		  }

		  if (!encoding) encoding = 'utf8';

		  while (true) {
		    switch (encoding) {
		      case 'hex':
		        return hexSlice(this, start, end)

		      case 'utf8':
		      case 'utf-8':
		        return utf8Slice(this, start, end)

		      case 'ascii':
		        return asciiSlice(this, start, end)

		      case 'latin1':
		      case 'binary':
		        return latin1Slice(this, start, end)

		      case 'base64':
		        return base64Slice(this, start, end)

		      case 'ucs2':
		      case 'ucs-2':
		      case 'utf16le':
		      case 'utf-16le':
		        return utf16leSlice(this, start, end)

		      default:
		        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
		        encoding = (encoding + '').toLowerCase();
		        loweredCase = true;
		    }
		  }
		}

		// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
		// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
		// reliably in a browserify context because there could be multiple different
		// copies of the 'buffer' package in use. This method works even for Buffer
		// instances that were created from another copy of the `buffer` package.
		// See: https://github.com/feross/buffer/issues/154
		Buffer.prototype._isBuffer = true;

		function swap (b, n, m) {
		  const i = b[n];
		  b[n] = b[m];
		  b[m] = i;
		}

		Buffer.prototype.swap16 = function swap16 () {
		  const len = this.length;
		  if (len % 2 !== 0) {
		    throw new RangeError('Buffer size must be a multiple of 16-bits')
		  }
		  for (let i = 0; i < len; i += 2) {
		    swap(this, i, i + 1);
		  }
		  return this
		};

		Buffer.prototype.swap32 = function swap32 () {
		  const len = this.length;
		  if (len % 4 !== 0) {
		    throw new RangeError('Buffer size must be a multiple of 32-bits')
		  }
		  for (let i = 0; i < len; i += 4) {
		    swap(this, i, i + 3);
		    swap(this, i + 1, i + 2);
		  }
		  return this
		};

		Buffer.prototype.swap64 = function swap64 () {
		  const len = this.length;
		  if (len % 8 !== 0) {
		    throw new RangeError('Buffer size must be a multiple of 64-bits')
		  }
		  for (let i = 0; i < len; i += 8) {
		    swap(this, i, i + 7);
		    swap(this, i + 1, i + 6);
		    swap(this, i + 2, i + 5);
		    swap(this, i + 3, i + 4);
		  }
		  return this
		};

		Buffer.prototype.toString = function toString () {
		  const length = this.length;
		  if (length === 0) return ''
		  if (arguments.length === 0) return utf8Slice(this, 0, length)
		  return slowToString.apply(this, arguments)
		};

		Buffer.prototype.toLocaleString = Buffer.prototype.toString;

		Buffer.prototype.equals = function equals (b) {
		  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
		  if (this === b) return true
		  return Buffer.compare(this, b) === 0
		};

		Buffer.prototype.inspect = function inspect () {
		  let str = '';
		  const max = exports$1.INSPECT_MAX_BYTES;
		  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim();
		  if (this.length > max) str += ' ... ';
		  return '<Buffer ' + str + '>'
		};
		if (customInspectSymbol) {
		  Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect;
		}

		Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
		  if (isInstance(target, Uint8Array)) {
		    target = Buffer.from(target, target.offset, target.byteLength);
		  }
		  if (!Buffer.isBuffer(target)) {
		    throw new TypeError(
		      'The "target" argument must be one of type Buffer or Uint8Array. ' +
		      'Received type ' + (typeof target)
		    )
		  }

		  if (start === undefined) {
		    start = 0;
		  }
		  if (end === undefined) {
		    end = target ? target.length : 0;
		  }
		  if (thisStart === undefined) {
		    thisStart = 0;
		  }
		  if (thisEnd === undefined) {
		    thisEnd = this.length;
		  }

		  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
		    throw new RangeError('out of range index')
		  }

		  if (thisStart >= thisEnd && start >= end) {
		    return 0
		  }
		  if (thisStart >= thisEnd) {
		    return -1
		  }
		  if (start >= end) {
		    return 1
		  }

		  start >>>= 0;
		  end >>>= 0;
		  thisStart >>>= 0;
		  thisEnd >>>= 0;

		  if (this === target) return 0

		  let x = thisEnd - thisStart;
		  let y = end - start;
		  const len = Math.min(x, y);

		  const thisCopy = this.slice(thisStart, thisEnd);
		  const targetCopy = target.slice(start, end);

		  for (let i = 0; i < len; ++i) {
		    if (thisCopy[i] !== targetCopy[i]) {
		      x = thisCopy[i];
		      y = targetCopy[i];
		      break
		    }
		  }

		  if (x < y) return -1
		  if (y < x) return 1
		  return 0
		};

		// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
		// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
		//
		// Arguments:
		// - buffer - a Buffer to search
		// - val - a string, Buffer, or number
		// - byteOffset - an index into `buffer`; will be clamped to an int32
		// - encoding - an optional encoding, relevant is val is a string
		// - dir - true for indexOf, false for lastIndexOf
		function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
		  // Empty buffer means no match
		  if (buffer.length === 0) return -1

		  // Normalize byteOffset
		  if (typeof byteOffset === 'string') {
		    encoding = byteOffset;
		    byteOffset = 0;
		  } else if (byteOffset > 0x7fffffff) {
		    byteOffset = 0x7fffffff;
		  } else if (byteOffset < -2147483648) {
		    byteOffset = -2147483648;
		  }
		  byteOffset = +byteOffset; // Coerce to Number.
		  if (numberIsNaN(byteOffset)) {
		    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
		    byteOffset = dir ? 0 : (buffer.length - 1);
		  }

		  // Normalize byteOffset: negative offsets start from the end of the buffer
		  if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
		  if (byteOffset >= buffer.length) {
		    if (dir) return -1
		    else byteOffset = buffer.length - 1;
		  } else if (byteOffset < 0) {
		    if (dir) byteOffset = 0;
		    else return -1
		  }

		  // Normalize val
		  if (typeof val === 'string') {
		    val = Buffer.from(val, encoding);
		  }

		  // Finally, search either indexOf (if dir is true) or lastIndexOf
		  if (Buffer.isBuffer(val)) {
		    // Special case: looking for empty string/buffer always fails
		    if (val.length === 0) {
		      return -1
		    }
		    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
		  } else if (typeof val === 'number') {
		    val = val & 0xFF; // Search for a byte value [0-255]
		    if (typeof Uint8Array.prototype.indexOf === 'function') {
		      if (dir) {
		        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
		      } else {
		        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
		      }
		    }
		    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
		  }

		  throw new TypeError('val must be string, number or Buffer')
		}

		function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
		  let indexSize = 1;
		  let arrLength = arr.length;
		  let valLength = val.length;

		  if (encoding !== undefined) {
		    encoding = String(encoding).toLowerCase();
		    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
		        encoding === 'utf16le' || encoding === 'utf-16le') {
		      if (arr.length < 2 || val.length < 2) {
		        return -1
		      }
		      indexSize = 2;
		      arrLength /= 2;
		      valLength /= 2;
		      byteOffset /= 2;
		    }
		  }

		  function read (buf, i) {
		    if (indexSize === 1) {
		      return buf[i]
		    } else {
		      return buf.readUInt16BE(i * indexSize)
		    }
		  }

		  let i;
		  if (dir) {
		    let foundIndex = -1;
		    for (i = byteOffset; i < arrLength; i++) {
		      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
		        if (foundIndex === -1) foundIndex = i;
		        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
		      } else {
		        if (foundIndex !== -1) i -= i - foundIndex;
		        foundIndex = -1;
		      }
		    }
		  } else {
		    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
		    for (i = byteOffset; i >= 0; i--) {
		      let found = true;
		      for (let j = 0; j < valLength; j++) {
		        if (read(arr, i + j) !== read(val, j)) {
		          found = false;
		          break
		        }
		      }
		      if (found) return i
		    }
		  }

		  return -1
		}

		Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
		  return this.indexOf(val, byteOffset, encoding) !== -1
		};

		Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
		  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
		};

		Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
		  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
		};

		function hexWrite (buf, string, offset, length) {
		  offset = Number(offset) || 0;
		  const remaining = buf.length - offset;
		  if (!length) {
		    length = remaining;
		  } else {
		    length = Number(length);
		    if (length > remaining) {
		      length = remaining;
		    }
		  }

		  const strLen = string.length;

		  if (length > strLen / 2) {
		    length = strLen / 2;
		  }
		  let i;
		  for (i = 0; i < length; ++i) {
		    const parsed = parseInt(string.substr(i * 2, 2), 16);
		    if (numberIsNaN(parsed)) return i
		    buf[offset + i] = parsed;
		  }
		  return i
		}

		function utf8Write (buf, string, offset, length) {
		  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
		}

		function asciiWrite (buf, string, offset, length) {
		  return blitBuffer(asciiToBytes(string), buf, offset, length)
		}

		function base64Write (buf, string, offset, length) {
		  return blitBuffer(base64ToBytes(string), buf, offset, length)
		}

		function ucs2Write (buf, string, offset, length) {
		  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
		}

		Buffer.prototype.write = function write (string, offset, length, encoding) {
		  // Buffer#write(string)
		  if (offset === undefined) {
		    encoding = 'utf8';
		    length = this.length;
		    offset = 0;
		  // Buffer#write(string, encoding)
		  } else if (length === undefined && typeof offset === 'string') {
		    encoding = offset;
		    length = this.length;
		    offset = 0;
		  // Buffer#write(string, offset[, length][, encoding])
		  } else if (isFinite(offset)) {
		    offset = offset >>> 0;
		    if (isFinite(length)) {
		      length = length >>> 0;
		      if (encoding === undefined) encoding = 'utf8';
		    } else {
		      encoding = length;
		      length = undefined;
		    }
		  } else {
		    throw new Error(
		      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
		    )
		  }

		  const remaining = this.length - offset;
		  if (length === undefined || length > remaining) length = remaining;

		  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
		    throw new RangeError('Attempt to write outside buffer bounds')
		  }

		  if (!encoding) encoding = 'utf8';

		  let loweredCase = false;
		  for (;;) {
		    switch (encoding) {
		      case 'hex':
		        return hexWrite(this, string, offset, length)

		      case 'utf8':
		      case 'utf-8':
		        return utf8Write(this, string, offset, length)

		      case 'ascii':
		      case 'latin1':
		      case 'binary':
		        return asciiWrite(this, string, offset, length)

		      case 'base64':
		        // Warning: maxLength not taken into account in base64Write
		        return base64Write(this, string, offset, length)

		      case 'ucs2':
		      case 'ucs-2':
		      case 'utf16le':
		      case 'utf-16le':
		        return ucs2Write(this, string, offset, length)

		      default:
		        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
		        encoding = ('' + encoding).toLowerCase();
		        loweredCase = true;
		    }
		  }
		};

		Buffer.prototype.toJSON = function toJSON () {
		  return {
		    type: 'Buffer',
		    data: Array.prototype.slice.call(this._arr || this, 0)
		  }
		};

		function base64Slice (buf, start, end) {
		  if (start === 0 && end === buf.length) {
		    return base64.fromByteArray(buf)
		  } else {
		    return base64.fromByteArray(buf.slice(start, end))
		  }
		}

		function utf8Slice (buf, start, end) {
		  end = Math.min(buf.length, end);
		  const res = [];

		  let i = start;
		  while (i < end) {
		    const firstByte = buf[i];
		    let codePoint = null;
		    let bytesPerSequence = (firstByte > 0xEF)
		      ? 4
		      : (firstByte > 0xDF)
		          ? 3
		          : (firstByte > 0xBF)
		              ? 2
		              : 1;

		    if (i + bytesPerSequence <= end) {
		      let secondByte, thirdByte, fourthByte, tempCodePoint;

		      switch (bytesPerSequence) {
		        case 1:
		          if (firstByte < 0x80) {
		            codePoint = firstByte;
		          }
		          break
		        case 2:
		          secondByte = buf[i + 1];
		          if ((secondByte & 0xC0) === 0x80) {
		            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
		            if (tempCodePoint > 0x7F) {
		              codePoint = tempCodePoint;
		            }
		          }
		          break
		        case 3:
		          secondByte = buf[i + 1];
		          thirdByte = buf[i + 2];
		          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
		            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
		            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
		              codePoint = tempCodePoint;
		            }
		          }
		          break
		        case 4:
		          secondByte = buf[i + 1];
		          thirdByte = buf[i + 2];
		          fourthByte = buf[i + 3];
		          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
		            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
		            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
		              codePoint = tempCodePoint;
		            }
		          }
		      }
		    }

		    if (codePoint === null) {
		      // we did not generate a valid codePoint so insert a
		      // replacement char (U+FFFD) and advance only 1 byte
		      codePoint = 0xFFFD;
		      bytesPerSequence = 1;
		    } else if (codePoint > 0xFFFF) {
		      // encode to utf16 (surrogate pair dance)
		      codePoint -= 0x10000;
		      res.push(codePoint >>> 10 & 0x3FF | 0xD800);
		      codePoint = 0xDC00 | codePoint & 0x3FF;
		    }

		    res.push(codePoint);
		    i += bytesPerSequence;
		  }

		  return decodeCodePointsArray(res)
		}

		// Based on http://stackoverflow.com/a/22747272/680742, the browser with
		// the lowest limit is Chrome, with 0x10000 args.
		// We go 1 magnitude less, for safety
		const MAX_ARGUMENTS_LENGTH = 0x1000;

		function decodeCodePointsArray (codePoints) {
		  const len = codePoints.length;
		  if (len <= MAX_ARGUMENTS_LENGTH) {
		    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
		  }

		  // Decode in chunks to avoid "call stack size exceeded".
		  let res = '';
		  let i = 0;
		  while (i < len) {
		    res += String.fromCharCode.apply(
		      String,
		      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
		    );
		  }
		  return res
		}

		function asciiSlice (buf, start, end) {
		  let ret = '';
		  end = Math.min(buf.length, end);

		  for (let i = start; i < end; ++i) {
		    ret += String.fromCharCode(buf[i] & 0x7F);
		  }
		  return ret
		}

		function latin1Slice (buf, start, end) {
		  let ret = '';
		  end = Math.min(buf.length, end);

		  for (let i = start; i < end; ++i) {
		    ret += String.fromCharCode(buf[i]);
		  }
		  return ret
		}

		function hexSlice (buf, start, end) {
		  const len = buf.length;

		  if (!start || start < 0) start = 0;
		  if (!end || end < 0 || end > len) end = len;

		  let out = '';
		  for (let i = start; i < end; ++i) {
		    out += hexSliceLookupTable[buf[i]];
		  }
		  return out
		}

		function utf16leSlice (buf, start, end) {
		  const bytes = buf.slice(start, end);
		  let res = '';
		  // If bytes.length is odd, the last 8 bits must be ignored (same as node.js)
		  for (let i = 0; i < bytes.length - 1; i += 2) {
		    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256));
		  }
		  return res
		}

		Buffer.prototype.slice = function slice (start, end) {
		  const len = this.length;
		  start = ~~start;
		  end = end === undefined ? len : ~~end;

		  if (start < 0) {
		    start += len;
		    if (start < 0) start = 0;
		  } else if (start > len) {
		    start = len;
		  }

		  if (end < 0) {
		    end += len;
		    if (end < 0) end = 0;
		  } else if (end > len) {
		    end = len;
		  }

		  if (end < start) end = start;

		  const newBuf = this.subarray(start, end);
		  // Return an augmented `Uint8Array` instance
		  Object.setPrototypeOf(newBuf, Buffer.prototype);

		  return newBuf
		};

		/*
		 * Need to make sure that buffer isn't trying to write out of bounds.
		 */
		function checkOffset (offset, ext, length) {
		  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
		  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
		}

		Buffer.prototype.readUintLE =
		Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
		  offset = offset >>> 0;
		  byteLength = byteLength >>> 0;
		  if (!noAssert) checkOffset(offset, byteLength, this.length);

		  let val = this[offset];
		  let mul = 1;
		  let i = 0;
		  while (++i < byteLength && (mul *= 0x100)) {
		    val += this[offset + i] * mul;
		  }

		  return val
		};

		Buffer.prototype.readUintBE =
		Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
		  offset = offset >>> 0;
		  byteLength = byteLength >>> 0;
		  if (!noAssert) {
		    checkOffset(offset, byteLength, this.length);
		  }

		  let val = this[offset + --byteLength];
		  let mul = 1;
		  while (byteLength > 0 && (mul *= 0x100)) {
		    val += this[offset + --byteLength] * mul;
		  }

		  return val
		};

		Buffer.prototype.readUint8 =
		Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 1, this.length);
		  return this[offset]
		};

		Buffer.prototype.readUint16LE =
		Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 2, this.length);
		  return this[offset] | (this[offset + 1] << 8)
		};

		Buffer.prototype.readUint16BE =
		Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 2, this.length);
		  return (this[offset] << 8) | this[offset + 1]
		};

		Buffer.prototype.readUint32LE =
		Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 4, this.length);

		  return ((this[offset]) |
		      (this[offset + 1] << 8) |
		      (this[offset + 2] << 16)) +
		      (this[offset + 3] * 0x1000000)
		};

		Buffer.prototype.readUint32BE =
		Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 4, this.length);

		  return (this[offset] * 0x1000000) +
		    ((this[offset + 1] << 16) |
		    (this[offset + 2] << 8) |
		    this[offset + 3])
		};

		Buffer.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE (offset) {
		  offset = offset >>> 0;
		  validateNumber(offset, 'offset');
		  const first = this[offset];
		  const last = this[offset + 7];
		  if (first === undefined || last === undefined) {
		    boundsError(offset, this.length - 8);
		  }

		  const lo = first +
		    this[++offset] * 2 ** 8 +
		    this[++offset] * 2 ** 16 +
		    this[++offset] * 2 ** 24;

		  const hi = this[++offset] +
		    this[++offset] * 2 ** 8 +
		    this[++offset] * 2 ** 16 +
		    last * 2 ** 24;

		  return BigInt(lo) + (BigInt(hi) << BigInt(32))
		});

		Buffer.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE (offset) {
		  offset = offset >>> 0;
		  validateNumber(offset, 'offset');
		  const first = this[offset];
		  const last = this[offset + 7];
		  if (first === undefined || last === undefined) {
		    boundsError(offset, this.length - 8);
		  }

		  const hi = first * 2 ** 24 +
		    this[++offset] * 2 ** 16 +
		    this[++offset] * 2 ** 8 +
		    this[++offset];

		  const lo = this[++offset] * 2 ** 24 +
		    this[++offset] * 2 ** 16 +
		    this[++offset] * 2 ** 8 +
		    last;

		  return (BigInt(hi) << BigInt(32)) + BigInt(lo)
		});

		Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
		  offset = offset >>> 0;
		  byteLength = byteLength >>> 0;
		  if (!noAssert) checkOffset(offset, byteLength, this.length);

		  let val = this[offset];
		  let mul = 1;
		  let i = 0;
		  while (++i < byteLength && (mul *= 0x100)) {
		    val += this[offset + i] * mul;
		  }
		  mul *= 0x80;

		  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

		  return val
		};

		Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
		  offset = offset >>> 0;
		  byteLength = byteLength >>> 0;
		  if (!noAssert) checkOffset(offset, byteLength, this.length);

		  let i = byteLength;
		  let mul = 1;
		  let val = this[offset + --i];
		  while (i > 0 && (mul *= 0x100)) {
		    val += this[offset + --i] * mul;
		  }
		  mul *= 0x80;

		  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

		  return val
		};

		Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 1, this.length);
		  if (!(this[offset] & 0x80)) return (this[offset])
		  return ((0xff - this[offset] + 1) * -1)
		};

		Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 2, this.length);
		  const val = this[offset] | (this[offset + 1] << 8);
		  return (val & 0x8000) ? val | 0xFFFF0000 : val
		};

		Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 2, this.length);
		  const val = this[offset + 1] | (this[offset] << 8);
		  return (val & 0x8000) ? val | 0xFFFF0000 : val
		};

		Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 4, this.length);

		  return (this[offset]) |
		    (this[offset + 1] << 8) |
		    (this[offset + 2] << 16) |
		    (this[offset + 3] << 24)
		};

		Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 4, this.length);

		  return (this[offset] << 24) |
		    (this[offset + 1] << 16) |
		    (this[offset + 2] << 8) |
		    (this[offset + 3])
		};

		Buffer.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE (offset) {
		  offset = offset >>> 0;
		  validateNumber(offset, 'offset');
		  const first = this[offset];
		  const last = this[offset + 7];
		  if (first === undefined || last === undefined) {
		    boundsError(offset, this.length - 8);
		  }

		  const val = this[offset + 4] +
		    this[offset + 5] * 2 ** 8 +
		    this[offset + 6] * 2 ** 16 +
		    (last << 24); // Overflow

		  return (BigInt(val) << BigInt(32)) +
		    BigInt(first +
		    this[++offset] * 2 ** 8 +
		    this[++offset] * 2 ** 16 +
		    this[++offset] * 2 ** 24)
		});

		Buffer.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE (offset) {
		  offset = offset >>> 0;
		  validateNumber(offset, 'offset');
		  const first = this[offset];
		  const last = this[offset + 7];
		  if (first === undefined || last === undefined) {
		    boundsError(offset, this.length - 8);
		  }

		  const val = (first << 24) + // Overflow
		    this[++offset] * 2 ** 16 +
		    this[++offset] * 2 ** 8 +
		    this[++offset];

		  return (BigInt(val) << BigInt(32)) +
		    BigInt(this[++offset] * 2 ** 24 +
		    this[++offset] * 2 ** 16 +
		    this[++offset] * 2 ** 8 +
		    last)
		});

		Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 4, this.length);
		  return ieee754.read(this, offset, true, 23, 4)
		};

		Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 4, this.length);
		  return ieee754.read(this, offset, false, 23, 4)
		};

		Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 8, this.length);
		  return ieee754.read(this, offset, true, 52, 8)
		};

		Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
		  offset = offset >>> 0;
		  if (!noAssert) checkOffset(offset, 8, this.length);
		  return ieee754.read(this, offset, false, 52, 8)
		};

		function checkInt (buf, value, offset, ext, max, min) {
		  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
		  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
		  if (offset + ext > buf.length) throw new RangeError('Index out of range')
		}

		Buffer.prototype.writeUintLE =
		Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  byteLength = byteLength >>> 0;
		  if (!noAssert) {
		    const maxBytes = Math.pow(2, 8 * byteLength) - 1;
		    checkInt(this, value, offset, byteLength, maxBytes, 0);
		  }

		  let mul = 1;
		  let i = 0;
		  this[offset] = value & 0xFF;
		  while (++i < byteLength && (mul *= 0x100)) {
		    this[offset + i] = (value / mul) & 0xFF;
		  }

		  return offset + byteLength
		};

		Buffer.prototype.writeUintBE =
		Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  byteLength = byteLength >>> 0;
		  if (!noAssert) {
		    const maxBytes = Math.pow(2, 8 * byteLength) - 1;
		    checkInt(this, value, offset, byteLength, maxBytes, 0);
		  }

		  let i = byteLength - 1;
		  let mul = 1;
		  this[offset + i] = value & 0xFF;
		  while (--i >= 0 && (mul *= 0x100)) {
		    this[offset + i] = (value / mul) & 0xFF;
		  }

		  return offset + byteLength
		};

		Buffer.prototype.writeUint8 =
		Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
		  this[offset] = (value & 0xff);
		  return offset + 1
		};

		Buffer.prototype.writeUint16LE =
		Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
		  this[offset] = (value & 0xff);
		  this[offset + 1] = (value >>> 8);
		  return offset + 2
		};

		Buffer.prototype.writeUint16BE =
		Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
		  this[offset] = (value >>> 8);
		  this[offset + 1] = (value & 0xff);
		  return offset + 2
		};

		Buffer.prototype.writeUint32LE =
		Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
		  this[offset + 3] = (value >>> 24);
		  this[offset + 2] = (value >>> 16);
		  this[offset + 1] = (value >>> 8);
		  this[offset] = (value & 0xff);
		  return offset + 4
		};

		Buffer.prototype.writeUint32BE =
		Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
		  this[offset] = (value >>> 24);
		  this[offset + 1] = (value >>> 16);
		  this[offset + 2] = (value >>> 8);
		  this[offset + 3] = (value & 0xff);
		  return offset + 4
		};

		function wrtBigUInt64LE (buf, value, offset, min, max) {
		  checkIntBI(value, min, max, buf, offset, 7);

		  let lo = Number(value & BigInt(0xffffffff));
		  buf[offset++] = lo;
		  lo = lo >> 8;
		  buf[offset++] = lo;
		  lo = lo >> 8;
		  buf[offset++] = lo;
		  lo = lo >> 8;
		  buf[offset++] = lo;
		  let hi = Number(value >> BigInt(32) & BigInt(0xffffffff));
		  buf[offset++] = hi;
		  hi = hi >> 8;
		  buf[offset++] = hi;
		  hi = hi >> 8;
		  buf[offset++] = hi;
		  hi = hi >> 8;
		  buf[offset++] = hi;
		  return offset
		}

		function wrtBigUInt64BE (buf, value, offset, min, max) {
		  checkIntBI(value, min, max, buf, offset, 7);

		  let lo = Number(value & BigInt(0xffffffff));
		  buf[offset + 7] = lo;
		  lo = lo >> 8;
		  buf[offset + 6] = lo;
		  lo = lo >> 8;
		  buf[offset + 5] = lo;
		  lo = lo >> 8;
		  buf[offset + 4] = lo;
		  let hi = Number(value >> BigInt(32) & BigInt(0xffffffff));
		  buf[offset + 3] = hi;
		  hi = hi >> 8;
		  buf[offset + 2] = hi;
		  hi = hi >> 8;
		  buf[offset + 1] = hi;
		  hi = hi >> 8;
		  buf[offset] = hi;
		  return offset + 8
		}

		Buffer.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE (value, offset = 0) {
		  return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'))
		});

		Buffer.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE (value, offset = 0) {
		  return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'))
		});

		Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) {
		    const limit = Math.pow(2, (8 * byteLength) - 1);

		    checkInt(this, value, offset, byteLength, limit - 1, -limit);
		  }

		  let i = 0;
		  let mul = 1;
		  let sub = 0;
		  this[offset] = value & 0xFF;
		  while (++i < byteLength && (mul *= 0x100)) {
		    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
		      sub = 1;
		    }
		    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
		  }

		  return offset + byteLength
		};

		Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) {
		    const limit = Math.pow(2, (8 * byteLength) - 1);

		    checkInt(this, value, offset, byteLength, limit - 1, -limit);
		  }

		  let i = byteLength - 1;
		  let mul = 1;
		  let sub = 0;
		  this[offset + i] = value & 0xFF;
		  while (--i >= 0 && (mul *= 0x100)) {
		    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
		      sub = 1;
		    }
		    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
		  }

		  return offset + byteLength
		};

		Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -128);
		  if (value < 0) value = 0xff + value + 1;
		  this[offset] = (value & 0xff);
		  return offset + 1
		};

		Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -32768);
		  this[offset] = (value & 0xff);
		  this[offset + 1] = (value >>> 8);
		  return offset + 2
		};

		Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -32768);
		  this[offset] = (value >>> 8);
		  this[offset + 1] = (value & 0xff);
		  return offset + 2
		};

		Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -2147483648);
		  this[offset] = (value & 0xff);
		  this[offset + 1] = (value >>> 8);
		  this[offset + 2] = (value >>> 16);
		  this[offset + 3] = (value >>> 24);
		  return offset + 4
		};

		Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -2147483648);
		  if (value < 0) value = 0xffffffff + value + 1;
		  this[offset] = (value >>> 24);
		  this[offset + 1] = (value >>> 16);
		  this[offset + 2] = (value >>> 8);
		  this[offset + 3] = (value & 0xff);
		  return offset + 4
		};

		Buffer.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE (value, offset = 0) {
		  return wrtBigUInt64LE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'))
		});

		Buffer.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE (value, offset = 0) {
		  return wrtBigUInt64BE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'))
		});

		function checkIEEE754 (buf, value, offset, ext, max, min) {
		  if (offset + ext > buf.length) throw new RangeError('Index out of range')
		  if (offset < 0) throw new RangeError('Index out of range')
		}

		function writeFloat (buf, value, offset, littleEndian, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) {
		    checkIEEE754(buf, value, offset, 4);
		  }
		  ieee754.write(buf, value, offset, littleEndian, 23, 4);
		  return offset + 4
		}

		Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
		  return writeFloat(this, value, offset, true, noAssert)
		};

		Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
		  return writeFloat(this, value, offset, false, noAssert)
		};

		function writeDouble (buf, value, offset, littleEndian, noAssert) {
		  value = +value;
		  offset = offset >>> 0;
		  if (!noAssert) {
		    checkIEEE754(buf, value, offset, 8);
		  }
		  ieee754.write(buf, value, offset, littleEndian, 52, 8);
		  return offset + 8
		}

		Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
		  return writeDouble(this, value, offset, true, noAssert)
		};

		Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
		  return writeDouble(this, value, offset, false, noAssert)
		};

		// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
		Buffer.prototype.copy = function copy (target, targetStart, start, end) {
		  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
		  if (!start) start = 0;
		  if (!end && end !== 0) end = this.length;
		  if (targetStart >= target.length) targetStart = target.length;
		  if (!targetStart) targetStart = 0;
		  if (end > 0 && end < start) end = start;

		  // Copy 0 bytes; we're done
		  if (end === start) return 0
		  if (target.length === 0 || this.length === 0) return 0

		  // Fatal error conditions
		  if (targetStart < 0) {
		    throw new RangeError('targetStart out of bounds')
		  }
		  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
		  if (end < 0) throw new RangeError('sourceEnd out of bounds')

		  // Are we oob?
		  if (end > this.length) end = this.length;
		  if (target.length - targetStart < end - start) {
		    end = target.length - targetStart + start;
		  }

		  const len = end - start;

		  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
		    // Use built-in when available, missing from IE11
		    this.copyWithin(targetStart, start, end);
		  } else {
		    Uint8Array.prototype.set.call(
		      target,
		      this.subarray(start, end),
		      targetStart
		    );
		  }

		  return len
		};

		// Usage:
		//    buffer.fill(number[, offset[, end]])
		//    buffer.fill(buffer[, offset[, end]])
		//    buffer.fill(string[, offset[, end]][, encoding])
		Buffer.prototype.fill = function fill (val, start, end, encoding) {
		  // Handle string cases:
		  if (typeof val === 'string') {
		    if (typeof start === 'string') {
		      encoding = start;
		      start = 0;
		      end = this.length;
		    } else if (typeof end === 'string') {
		      encoding = end;
		      end = this.length;
		    }
		    if (encoding !== undefined && typeof encoding !== 'string') {
		      throw new TypeError('encoding must be a string')
		    }
		    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
		      throw new TypeError('Unknown encoding: ' + encoding)
		    }
		    if (val.length === 1) {
		      const code = val.charCodeAt(0);
		      if ((encoding === 'utf8' && code < 128) ||
		          encoding === 'latin1') {
		        // Fast path: If `val` fits into a single byte, use that numeric value.
		        val = code;
		      }
		    }
		  } else if (typeof val === 'number') {
		    val = val & 255;
		  } else if (typeof val === 'boolean') {
		    val = Number(val);
		  }

		  // Invalid ranges are not set to a default, so can range check early.
		  if (start < 0 || this.length < start || this.length < end) {
		    throw new RangeError('Out of range index')
		  }

		  if (end <= start) {
		    return this
		  }

		  start = start >>> 0;
		  end = end === undefined ? this.length : end >>> 0;

		  if (!val) val = 0;

		  let i;
		  if (typeof val === 'number') {
		    for (i = start; i < end; ++i) {
		      this[i] = val;
		    }
		  } else {
		    const bytes = Buffer.isBuffer(val)
		      ? val
		      : Buffer.from(val, encoding);
		    const len = bytes.length;
		    if (len === 0) {
		      throw new TypeError('The value "' + val +
		        '" is invalid for argument "value"')
		    }
		    for (i = 0; i < end - start; ++i) {
		      this[i + start] = bytes[i % len];
		    }
		  }

		  return this
		};

		// CUSTOM ERRORS
		// =============

		// Simplified versions from Node, changed for Buffer-only usage
		const errors = {};
		function E (sym, getMessage, Base) {
		  errors[sym] = class NodeError extends Base {
		    constructor () {
		      super();

		      Object.defineProperty(this, 'message', {
		        value: getMessage.apply(this, arguments),
		        writable: true,
		        configurable: true
		      });

		      // Add the error code to the name to include it in the stack trace.
		      this.name = `${this.name} [${sym}]`;
		      // Access the stack to generate the error message including the error code
		      // from the name.
		      this.stack; // eslint-disable-line no-unused-expressions
		      // Reset the name to the actual name.
		      delete this.name;
		    }

		    get code () {
		      return sym
		    }

		    set code (value) {
		      Object.defineProperty(this, 'code', {
		        configurable: true,
		        enumerable: true,
		        value,
		        writable: true
		      });
		    }

		    toString () {
		      return `${this.name} [${sym}]: ${this.message}`
		    }
		  };
		}

		E('ERR_BUFFER_OUT_OF_BOUNDS',
		  function (name) {
		    if (name) {
		      return `${name} is outside of buffer bounds`
		    }

		    return 'Attempt to access memory outside buffer bounds'
		  }, RangeError);
		E('ERR_INVALID_ARG_TYPE',
		  function (name, actual) {
		    return `The "${name}" argument must be of type number. Received type ${typeof actual}`
		  }, TypeError);
		E('ERR_OUT_OF_RANGE',
		  function (str, range, input) {
		    let msg = `The value of "${str}" is out of range.`;
		    let received = input;
		    if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
		      received = addNumericalSeparator(String(input));
		    } else if (typeof input === 'bigint') {
		      received = String(input);
		      if (input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))) {
		        received = addNumericalSeparator(received);
		      }
		      received += 'n';
		    }
		    msg += ` It must be ${range}. Received ${received}`;
		    return msg
		  }, RangeError);

		function addNumericalSeparator (val) {
		  let res = '';
		  let i = val.length;
		  const start = val[0] === '-' ? 1 : 0;
		  for (; i >= start + 4; i -= 3) {
		    res = `_${val.slice(i - 3, i)}${res}`;
		  }
		  return `${val.slice(0, i)}${res}`
		}

		// CHECK FUNCTIONS
		// ===============

		function checkBounds (buf, offset, byteLength) {
		  validateNumber(offset, 'offset');
		  if (buf[offset] === undefined || buf[offset + byteLength] === undefined) {
		    boundsError(offset, buf.length - (byteLength + 1));
		  }
		}

		function checkIntBI (value, min, max, buf, offset, byteLength) {
		  if (value > max || value < min) {
		    const n = typeof min === 'bigint' ? 'n' : '';
		    let range;
		    {
		      if (min === 0 || min === BigInt(0)) {
		        range = `>= 0${n} and < 2${n} ** ${(byteLength + 1) * 8}${n}`;
		      } else {
		        range = `>= -(2${n} ** ${(byteLength + 1) * 8 - 1}${n}) and < 2 ** ` +
		                `${(byteLength + 1) * 8 - 1}${n}`;
		      }
		    }
		    throw new errors.ERR_OUT_OF_RANGE('value', range, value)
		  }
		  checkBounds(buf, offset, byteLength);
		}

		function validateNumber (value, name) {
		  if (typeof value !== 'number') {
		    throw new errors.ERR_INVALID_ARG_TYPE(name, 'number', value)
		  }
		}

		function boundsError (value, length, type) {
		  if (Math.floor(value) !== value) {
		    validateNumber(value, type);
		    throw new errors.ERR_OUT_OF_RANGE('offset', 'an integer', value)
		  }

		  if (length < 0) {
		    throw new errors.ERR_BUFFER_OUT_OF_BOUNDS()
		  }

		  throw new errors.ERR_OUT_OF_RANGE('offset',
		                                    `>= ${0} and <= ${length}`,
		                                    value)
		}

		// HELPER FUNCTIONS
		// ================

		const INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;

		function base64clean (str) {
		  // Node takes equal signs as end of the Base64 encoding
		  str = str.split('=')[0];
		  // Node strips out invalid characters like \n and \t from the string, base64-js does not
		  str = str.trim().replace(INVALID_BASE64_RE, '');
		  // Node converts strings with length < 2 to ''
		  if (str.length < 2) return ''
		  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
		  while (str.length % 4 !== 0) {
		    str = str + '=';
		  }
		  return str
		}

		function utf8ToBytes (string, units) {
		  units = units || Infinity;
		  let codePoint;
		  const length = string.length;
		  let leadSurrogate = null;
		  const bytes = [];

		  for (let i = 0; i < length; ++i) {
		    codePoint = string.charCodeAt(i);

		    // is surrogate component
		    if (codePoint > 0xD7FF && codePoint < 0xE000) {
		      // last char was a lead
		      if (!leadSurrogate) {
		        // no lead yet
		        if (codePoint > 0xDBFF) {
		          // unexpected trail
		          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
		          continue
		        } else if (i + 1 === length) {
		          // unpaired lead
		          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
		          continue
		        }

		        // valid lead
		        leadSurrogate = codePoint;

		        continue
		      }

		      // 2 leads in a row
		      if (codePoint < 0xDC00) {
		        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
		        leadSurrogate = codePoint;
		        continue
		      }

		      // valid surrogate pair
		      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
		    } else if (leadSurrogate) {
		      // valid bmp char, but last char was a lead
		      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
		    }

		    leadSurrogate = null;

		    // encode utf8
		    if (codePoint < 0x80) {
		      if ((units -= 1) < 0) break
		      bytes.push(codePoint);
		    } else if (codePoint < 0x800) {
		      if ((units -= 2) < 0) break
		      bytes.push(
		        codePoint >> 0x6 | 0xC0,
		        codePoint & 0x3F | 0x80
		      );
		    } else if (codePoint < 0x10000) {
		      if ((units -= 3) < 0) break
		      bytes.push(
		        codePoint >> 0xC | 0xE0,
		        codePoint >> 0x6 & 0x3F | 0x80,
		        codePoint & 0x3F | 0x80
		      );
		    } else if (codePoint < 0x110000) {
		      if ((units -= 4) < 0) break
		      bytes.push(
		        codePoint >> 0x12 | 0xF0,
		        codePoint >> 0xC & 0x3F | 0x80,
		        codePoint >> 0x6 & 0x3F | 0x80,
		        codePoint & 0x3F | 0x80
		      );
		    } else {
		      throw new Error('Invalid code point')
		    }
		  }

		  return bytes
		}

		function asciiToBytes (str) {
		  const byteArray = [];
		  for (let i = 0; i < str.length; ++i) {
		    // Node's code seems to be doing this and not & 0x7F..
		    byteArray.push(str.charCodeAt(i) & 0xFF);
		  }
		  return byteArray
		}

		function utf16leToBytes (str, units) {
		  let c, hi, lo;
		  const byteArray = [];
		  for (let i = 0; i < str.length; ++i) {
		    if ((units -= 2) < 0) break

		    c = str.charCodeAt(i);
		    hi = c >> 8;
		    lo = c % 256;
		    byteArray.push(lo);
		    byteArray.push(hi);
		  }

		  return byteArray
		}

		function base64ToBytes (str) {
		  return base64.toByteArray(base64clean(str))
		}

		function blitBuffer (src, dst, offset, length) {
		  let i;
		  for (i = 0; i < length; ++i) {
		    if ((i + offset >= dst.length) || (i >= src.length)) break
		    dst[i + offset] = src[i];
		  }
		  return i
		}

		// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
		// the `instanceof` check but they should be treated as of that type.
		// See: https://github.com/feross/buffer/issues/166
		function isInstance (obj, type) {
		  return obj instanceof type ||
		    (obj != null && obj.constructor != null && obj.constructor.name != null &&
		      obj.constructor.name === type.name)
		}
		function numberIsNaN (obj) {
		  // For IE11 support
		  return obj !== obj // eslint-disable-line no-self-compare
		}

		// Create lookup table for `toString('hex')`
		// See: https://github.com/feross/buffer/issues/219
		const hexSliceLookupTable = (function () {
		  const alphabet = '0123456789abcdef';
		  const table = new Array(256);
		  for (let i = 0; i < 16; ++i) {
		    const i16 = i * 16;
		    for (let j = 0; j < 16; ++j) {
		      table[i16 + j] = alphabet[i] + alphabet[j];
		    }
		  }
		  return table
		})();

		// Return not function with Error if BigInt not supported
		function defineBigIntMethod (fn) {
		  return typeof BigInt === 'undefined' ? BufferBigIntNotDefined : fn
		}

		function BufferBigIntNotDefined () {
		  throw new Error('BigInt not supported')
		} 
	} (buffer$1));
	return buffer$1;
}

var bufferExports = requireBuffer();

/**
 * Distinct mapping for various cryptocurrency platforms and networks to allow
 * HD logic mapping onto universally recognizable names and paths.
 */
const NETWORK_NAMES$1 = {
	VIAT: 0};
/**
 * Specifies the environment type (e.g., MAINNET, TESTNET, DEVNET) for creating
 * and separating networking scopes and validating derivations.
 */
const CRYPTOCURRENCY_NETWORK_TYPES$1 = {
	MAINNET: 0,
	TESTNET: 1,
	DEVNET: 2,
	UNKNOWN: 3,
	CUSTOM: 255,
};
var cryptoCurrencyDefaults = {
	CRYPTOCURRENCY_NETWORK_TYPES: CRYPTOCURRENCY_NETWORK_TYPES$1,
};

/**
 * Checks if something is Uint8Array. Be careful: nodejs Buffer will return true.
 * @param a - value to test
 * @returns `true` when the value is a Uint8Array-compatible view.
 * @example
 * Check whether a value is a Uint8Array-compatible view.
 * ```ts
 * isBytes(new Uint8Array([1, 2, 3]));
 * ```
 */
function isBytes$2(a) {
    // Plain `instanceof Uint8Array` is too strict for some Buffer / proxy / cross-realm cases.
    // The fallback still requires a real ArrayBuffer view, so plain
    // JSON-deserialized `{ constructor: ... }` spoofing is rejected, and
    // `BYTES_PER_ELEMENT === 1` keeps the fallback on byte-oriented views.
    return (a instanceof Uint8Array ||
        (ArrayBuffer.isView(a) &&
            a.constructor.name === 'Uint8Array' &&
            'BYTES_PER_ELEMENT' in a &&
            a.BYTES_PER_ELEMENT === 1));
}
/**
 * Asserts something is a non-negative integer.
 * @param n - number to validate
 * @param title - label included in thrown errors
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Validate a non-negative integer option.
 * ```ts
 * anumber(32, 'length');
 * ```
 */
function anumber$2(n, title = '') {
    if (typeof n !== 'number') {
        const prefix = title && `"${title}" `;
        throw new TypeError(`${prefix}expected number, got ${typeof n}`);
    }
    if (!Number.isSafeInteger(n) || n < 0) {
        const prefix = title && `"${title}" `;
        throw new RangeError(`${prefix}expected integer >= 0, got ${n}`);
    }
}
/**
 * Asserts something is Uint8Array.
 * @param value - value to validate
 * @param length - optional exact length constraint
 * @param title - label included in thrown errors
 * @returns The validated byte array.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Validate that a value is a byte array.
 * ```ts
 * abytes(new Uint8Array([1, 2, 3]));
 * ```
 */
function abytes$2(value, length, title = '') {
    const bytes = isBytes$2(value);
    const len = value?.length;
    const needsLen = length !== undefined;
    if (!bytes || (needsLen && len !== length)) {
        const prefix = title && `"${title}" `;
        const ofLen = needsLen ? ` of length ${length}` : '';
        const got = bytes ? `length=${len}` : `type=${typeof value}`;
        const message = prefix + 'expected Uint8Array' + ofLen + ', got ' + got;
        if (!bytes)
            throw new TypeError(message);
        throw new RangeError(message);
    }
    return value;
}
/**
 * Asserts a hash instance has not been destroyed or finished.
 * @param instance - hash instance to validate
 * @param checkFinished - whether to reject finalized instances
 * @throws If the hash instance has already been destroyed or finalized. {@link Error}
 * @example
 * Validate that a hash instance is still usable.
 * ```ts
 * import { aexists } from '@noble/hashes/utils.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const hash = sha256.create();
 * aexists(hash);
 * ```
 */
function aexists$1(instance, checkFinished = true) {
    if (instance.destroyed)
        throw new Error('Hash instance has been destroyed');
    if (checkFinished && instance.finished)
        throw new Error('Hash#digest() has already been called');
}
/**
 * Asserts output is a sufficiently-sized byte array.
 * @param out - destination buffer
 * @param instance - hash instance providing output length
 * Oversized buffers are allowed; downstream code only promises to fill the first `outputLen` bytes.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Validate a caller-provided digest buffer.
 * ```ts
 * import { aoutput } from '@noble/hashes/utils.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const hash = sha256.create();
 * aoutput(new Uint8Array(hash.outputLen), hash);
 * ```
 */
function aoutput$1(out, instance) {
    abytes$2(out, undefined, 'digestInto() output');
    const min = instance.outputLen;
    if (out.length < min) {
        throw new RangeError('"digestInto() output" expected to be of length >=' + min);
    }
}
/**
 * Casts a typed array view to Uint32Array.
 * `arr.byteOffset` must already be 4-byte aligned or the platform
 * Uint32Array constructor will throw.
 * @param arr - source typed array
 * @returns Uint32Array view over the same buffer.
 * @example
 * Reinterpret a byte array as 32-bit words.
 * ```ts
 * u32(new Uint8Array(8));
 * ```
 */
function u32$1(arr) {
    return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
/**
 * Zeroizes typed arrays in place. Warning: JS provides no guarantees.
 * @param arrays - arrays to overwrite with zeros
 * @example
 * Zeroize sensitive buffers in place.
 * ```ts
 * clean(new Uint8Array([1, 2, 3]));
 * ```
 */
function clean$1(...arrays) {
    for (let i = 0; i < arrays.length; i++) {
        arrays[i].fill(0);
    }
}
/**
 * Creates a DataView for byte-level manipulation.
 * @param arr - source typed array
 * @returns DataView over the same buffer region.
 * @example
 * Create a DataView over an existing buffer.
 * ```ts
 * createView(new Uint8Array(4));
 * ```
 */
function createView$1(arr) {
    return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
/** Whether the current platform is little-endian. */
const isLE$1 = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([0x11223344]).buffer)[0] === 0x44)();
/**
 * Byte-swap operation for uint32 values.
 * @param word - source word
 * @returns Word with reversed byte order.
 * @example
 * Reverse the byte order of a 32-bit word.
 * ```ts
 * byteSwap(0x11223344);
 * ```
 */
function byteSwap$1(word) {
    return (((word << 24) & 0xff000000) |
        ((word << 8) & 0xff0000) |
        ((word >>> 8) & 0xff00) |
        ((word >>> 24) & 0xff));
}
/**
 * Byte-swaps every word of a Uint32Array in place.
 * @param arr - array to mutate
 * @returns The same array after mutation; callers pass live state arrays here.
 * @example
 * Reverse the byte order of every word in place.
 * ```ts
 * byteSwap32(new Uint32Array([0x11223344]));
 * ```
 */
function byteSwap32$1(arr) {
    for (let i = 0; i < arr.length; i++) {
        arr[i] = byteSwap$1(arr[i]);
    }
    return arr;
}
/**
 * Conditionally byte-swaps a Uint32Array on big-endian platforms.
 * @param u - array to normalize for host endianness
 * @returns Original or byte-swapped array depending on platform endianness.
 *   On big-endian runtimes this mutates `u` in place via `byteSwap32(...)`.
 * @example
 * Normalize a word array for host endianness.
 * ```ts
 * swap32IfBE(new Uint32Array([0x11223344]));
 * ```
 */
const swap32IfBE$1 = isLE$1
    ? (u) => u
    : byteSwap32$1;
// Built-in hex conversion https://caniuse.com/mdn-javascript_builtins_uint8array_fromhex
const hasHexBuiltin = /* @__PURE__ */ (() => 
// @ts-ignore
typeof Uint8Array.from([]).toHex === 'function' && typeof Uint8Array.fromHex === 'function')();
// Array where index 0xf0 (240) is mapped to string 'f0'
const hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));
/**
 * Convert byte array to hex string.
 * Uses the built-in function when available and assumes it matches the tested
 * fallback semantics.
 * @param bytes - bytes to encode
 * @returns Lowercase hexadecimal string.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Convert bytes to lowercase hexadecimal.
 * ```ts
 * bytesToHex(Uint8Array.from([0xca, 0xfe, 0x01, 0x23])); // 'cafe0123'
 * ```
 */
function bytesToHex$1(bytes) {
    abytes$2(bytes);
    // @ts-ignore
    if (hasHexBuiltin)
        return bytes.toHex();
    // pre-caching improves the speed 6x
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
        hex += hexes[bytes[i]];
    }
    return hex;
}
// We use optimized technique to convert hex string to byte array
const asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
function asciiToBase16(ch) {
    if (ch >= asciis._0 && ch <= asciis._9)
        return ch - asciis._0; // '2' => 50-48
    if (ch >= asciis.A && ch <= asciis.F)
        return ch - (asciis.A - 10); // 'B' => 66-(65-10)
    if (ch >= asciis.a && ch <= asciis.f)
        return ch - (asciis.a - 10); // 'b' => 98-(97-10)
    return;
}
/**
 * Convert hex string to byte array. Uses built-in function, when available.
 * @param hex - hexadecimal string to decode
 * @returns Decoded bytes.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Decode lowercase hexadecimal into bytes.
 * ```ts
 * hexToBytes('cafe0123'); // Uint8Array.from([0xca, 0xfe, 0x01, 0x23])
 * ```
 */
function hexToBytes$1(hex) {
    if (typeof hex !== 'string')
        throw new TypeError('hex string expected, got ' + typeof hex);
    if (hasHexBuiltin) {
        try {
            return Uint8Array.fromHex(hex);
        }
        catch (error) {
            if (error instanceof SyntaxError)
                throw new RangeError(error.message);
            throw error;
        }
    }
    const hl = hex.length;
    const al = hl / 2;
    if (hl % 2)
        throw new RangeError('hex string expected, got unpadded hex of length ' + hl);
    const array = new Uint8Array(al);
    for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
        const n1 = asciiToBase16(hex.charCodeAt(hi));
        const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
        if (n1 === undefined || n2 === undefined) {
            const char = hex[hi] + hex[hi + 1];
            throw new RangeError('hex string expected, got non-hex character "' + char + '" at index ' + hi);
        }
        array[ai] = n1 * 16 + n2; // multiply first octet, e.g. 'a3' => 10*16+3 => 160 + 3 => 163
    }
    return array;
}
/**
 * Converts string to bytes using UTF8 encoding.
 * Built-in doesn't validate input to be string: we do the check.
 * Non-ASCII details are delegated to the platform `TextEncoder`.
 * @param str - string to encode
 * @returns UTF-8 encoded bytes.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Encode a string as UTF-8 bytes.
 * ```ts
 * utf8ToBytes('abc'); // Uint8Array.from([97, 98, 99])
 * ```
 */
function utf8ToBytes$1(str) {
    if (typeof str !== 'string')
        throw new TypeError('string expected');
    return new Uint8Array(new TextEncoder().encode(str)); // https://bugzil.la/1681809
}
/**
 * Helper for KDFs: consumes Uint8Array or string.
 * String inputs are UTF-8 encoded; byte-array inputs stay aliased to the caller buffer.
 * @param data - user-provided KDF input
 * @param errorTitle - label included in thrown errors
 * @returns Byte representation of the input.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Normalize KDF input to bytes.
 * ```ts
 * kdfInputToBytes('password');
 * ```
 */
function kdfInputToBytes(data, errorTitle = '') {
    if (typeof data === 'string')
        return utf8ToBytes$1(data);
    return abytes$2(data, undefined, errorTitle);
}
/**
 * Copies several Uint8Arrays into one.
 * @param arrays - arrays to concatenate
 * @returns Concatenated byte array.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Concatenate multiple byte arrays.
 * ```ts
 * concatBytes(new Uint8Array([1]), new Uint8Array([2]));
 * ```
 */
function concatBytes$1(...arrays) {
    let sum = 0;
    for (let i = 0; i < arrays.length; i++) {
        const a = arrays[i];
        abytes$2(a);
        sum += a.length;
    }
    const res = new Uint8Array(sum);
    for (let i = 0, pad = 0; i < arrays.length; i++) {
        const a = arrays[i];
        res.set(a, pad);
        pad += a.length;
    }
    return res;
}
/**
 * Creates a callable hash function from a stateful class constructor.
 * @param hashCons - hash constructor or factory
 * @param info - optional metadata such as DER OID
 * @returns Frozen callable hash wrapper with `.create()`.
 *   Wrapper construction eagerly calls `hashCons(undefined)` once to read
 *   `outputLen` / `blockLen`, so constructor side effects happen at module
 *   init time.
 * @example
 * Wrap a stateful hash constructor into a callable helper.
 * ```ts
 * import { createHasher } from '@noble/hashes/utils.js';
 * import { sha256 } from '@noble/hashes/sha2.js';
 * const wrapped = createHasher(sha256.create, { oid: sha256.oid });
 * wrapped(new Uint8Array([1]));
 * ```
 */
function createHasher(hashCons, info = {}) {
    const hashC = (msg, opts) => hashCons(opts)
        .update(msg)
        .digest();
    const tmp = hashCons(undefined);
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.canXOF = tmp.canXOF;
    hashC.create = (opts) => hashCons(opts);
    Object.assign(hashC, info);
    return Object.freeze(hashC);
}
/**
 * Cryptographically secure PRNG backed by `crypto.getRandomValues`.
 * @param bytesLength - number of random bytes to generate
 * @returns Random bytes.
 * The platform `getRandomValues()` implementation still defines any
 * single-call length cap, and this helper rejects oversize requests
 * with a stable library `RangeError` instead of host-specific errors.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @throws If the current runtime does not provide `crypto.getRandomValues`. {@link Error}
 * @example
 * Generate a fresh random key or nonce.
 * ```ts
 * const key = randomBytes(16);
 * ```
 */
function randomBytes$3(bytesLength = 32) {
    // Match the repo's other length-taking helpers instead of relying on Uint8Array coercion.
    anumber$2(bytesLength, 'bytesLength');
    const cr = typeof globalThis === 'object' ? globalThis.crypto : null;
    if (typeof cr?.getRandomValues !== 'function')
        throw new Error('crypto.getRandomValues must be defined');
    // Web Cryptography API Level 2 §10.1.1:
    // if `byteLength > 65536`, throw `QuotaExceededError`.
    // Keep the guard explicit so callers can see the quota in code
    // instead of discovering it by reading the spec or host errors.
    // This wrapper surfaces the same quota as a stable library RangeError.
    if (bytesLength > 65536)
        throw new RangeError(`"bytesLength" expected <= 65536, got ${bytesLength}`);
    return cr.getRandomValues(new Uint8Array(bytesLength));
}
/**
 * Creates OID metadata for NIST hashes with prefix `06 09 60 86 48 01 65 03 04 02`.
 * @param suffix - final OID byte for the selected hash.
 *   The helper accepts any byte even though only the documented NIST hash
 *   suffixes are meaningful downstream.
 * @returns Object containing the DER-encoded OID.
 * @example
 * Build OID metadata for a NIST hash.
 * ```ts
 * oidNist(0x01);
 * ```
 */
const oidNist = (suffix) => ({
    // Current NIST hashAlgs suffixes used here fit in one DER subidentifier octet.
    // Larger suffix values would need base-128 OID encoding and a different length byte.
    oid: Uint8Array.from([0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, suffix]),
});

/**
 * Internal Merkle-Damgard hash utils.
 * @module
 */
/**
 * Merkle-Damgard hash construction base class.
 * Could be used to create MD5, RIPEMD, SHA1, SHA2.
 * Accepts only byte-aligned `Uint8Array` input, even when the underlying spec describes bit
 * strings with partial-byte tails.
 * @param blockLen - internal block size in bytes
 * @param outputLen - digest size in bytes
 * @param padOffset - trailing length field size in bytes
 * @param isLE - whether length and state words are encoded in little-endian
 * @example
 * Use a concrete subclass to get the shared Merkle-Damgard update/digest flow.
 * ```ts
 * import { _SHA1 } from '@noble/hashes/legacy.js';
 * const hash = new _SHA1();
 * hash.update(new Uint8Array([97, 98, 99]));
 * hash.digest();
 * ```
 */
class HashMD {
    blockLen;
    outputLen;
    canXOF = false;
    padOffset;
    isLE;
    // For partial updates less than block size
    buffer;
    view;
    finished = false;
    length = 0;
    pos = 0;
    destroyed = false;
    constructor(blockLen, outputLen, padOffset, isLE) {
        this.blockLen = blockLen;
        this.outputLen = outputLen;
        this.padOffset = padOffset;
        this.isLE = isLE;
        this.buffer = new Uint8Array(blockLen);
        this.view = createView$1(this.buffer);
    }
    update(data) {
        aexists$1(this);
        abytes$2(data);
        const { view, buffer, blockLen } = this;
        const len = data.length;
        for (let pos = 0; pos < len;) {
            const take = Math.min(blockLen - this.pos, len - pos);
            // Fast path only when there is no buffered partial block: `take === blockLen` implies
            // `this.pos === 0`, so we can process full blocks directly from the input view.
            if (take === blockLen) {
                const dataView = createView$1(data);
                for (; blockLen <= len - pos; pos += blockLen)
                    this.process(dataView, pos);
                continue;
            }
            buffer.set(data.subarray(pos, pos + take), this.pos);
            this.pos += take;
            pos += take;
            if (this.pos === blockLen) {
                this.process(view, 0);
                this.pos = 0;
            }
        }
        this.length += data.length;
        this.roundClean();
        return this;
    }
    digestInto(out) {
        aexists$1(this);
        aoutput$1(out, this);
        this.finished = true;
        // Padding
        // We can avoid allocation of buffer for padding completely if it
        // was previously not allocated here. But it won't change performance.
        const { buffer, view, blockLen, isLE } = this;
        let { pos } = this;
        // append the bit '1' to the message
        buffer[pos++] = 0b10000000;
        clean$1(this.buffer.subarray(pos));
        // we have less than padOffset left in buffer, so we cannot put length in
        // current block, need process it and pad again
        if (this.padOffset > blockLen - pos) {
            this.process(view, 0);
            pos = 0;
        }
        // Pad until full block byte with zeros
        for (let i = pos; i < blockLen; i++)
            buffer[i] = 0;
        // `padOffset` reserves the whole length field. For SHA-384/512 the high 64 bits stay zero from
        // the padding fill above, and JS will overflow before user input can make that half non-zero.
        // So we only need to write the low 64 bits here.
        view.setBigUint64(blockLen - 8, BigInt(this.length * 8), isLE);
        this.process(view, 0);
        const oview = createView$1(out);
        const len = this.outputLen;
        // NOTE: we do division by 4 later, which must be fused in single op with modulo by JIT
        if (len % 4)
            throw new Error('_sha2: outputLen must be aligned to 32bit');
        const outLen = len / 4;
        const state = this.get();
        if (outLen > state.length)
            throw new Error('_sha2: outputLen bigger than state');
        for (let i = 0; i < outLen; i++)
            oview.setUint32(4 * i, state[i], isLE);
    }
    digest() {
        const { buffer, outputLen } = this;
        this.digestInto(buffer);
        // Copy before destroy(): subclasses wipe `buffer` during cleanup, but `digest()` must return
        // fresh bytes to the caller.
        const res = buffer.slice(0, outputLen);
        this.destroy();
        return res;
    }
    _cloneInto(to) {
        to ||= new this.constructor();
        to.set(...this.get());
        const { blockLen, buffer, length, finished, destroyed, pos } = this;
        to.destroyed = destroyed;
        to.finished = finished;
        to.length = length;
        to.pos = pos;
        // Only partial-block bytes need copying: when `length % blockLen === 0`, `pos === 0` and
        // later `update()` / `digestInto()` overwrite `to.buffer` from the start before reading it.
        if (length % blockLen)
            to.buffer.set(buffer);
        return to;
    }
    clone() {
        return this._cloneInto();
    }
}
/** Initial SHA512 state from RFC 6234 §6.3: eight RFC 64-bit `H(0)` words stored as sixteen
 * big-endian 32-bit halves. Derived from the fractional parts of the square roots of the first
 * eight prime numbers. Exported as a shared table; callers must treat it as read-only because
 * constructors copy halves from it by index. */
const SHA512_IV = /* @__PURE__ */ Uint32Array.from([
    0x6a09e667, 0xf3bcc908, 0xbb67ae85, 0x84caa73b, 0x3c6ef372, 0xfe94f82b, 0xa54ff53a, 0x5f1d36f1,
    0x510e527f, 0xade682d1, 0x9b05688c, 0x2b3e6c1f, 0x1f83d9ab, 0xfb41bd6b, 0x5be0cd19, 0x137e2179,
]);

const U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
const _32n = /* @__PURE__ */ BigInt(32);
// Split bigint into two 32-bit halves. With `le=true`, returned fields become `{ h: low, l: high
// }` to match little-endian word order rather than the property names.
function fromBig(n, le = false) {
    if (le)
        return { h: Number(n & U32_MASK64), l: Number((n >> _32n) & U32_MASK64) };
    return { h: Number((n >> _32n) & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}
// Split bigint list into `[highWords, lowWords]` when `le=false`; with `le=true`, the first array
// holds the low halves because `fromBig(...)` swaps the semantic meaning of `h` and `l`.
function split(lst, le = false) {
    const len = lst.length;
    let Ah = new Uint32Array(len);
    let Al = new Uint32Array(len);
    for (let i = 0; i < len; i++) {
        const { h, l } = fromBig(lst[i], le);
        [Ah[i], Al[i]] = [h, l];
    }
    return [Ah, Al];
}
// High 32-bit half of a 64-bit logical right shift for `s` in `0..31`.
const shrSH = (h, _l, s) => h >>> s;
// Low 32-bit half of a 64-bit logical right shift, valid for `s` in `1..31`.
const shrSL = (h, l, s) => (h << (32 - s)) | (l >>> s);
// High 32-bit half of a 64-bit right rotate, valid for `s` in `1..31`.
const rotrSH = (h, l, s) => (h >>> s) | (l << (32 - s));
// Low 32-bit half of a 64-bit right rotate, valid for `s` in `1..31`.
const rotrSL = (h, l, s) => (h << (32 - s)) | (l >>> s);
// High 32-bit half of a 64-bit right rotate, valid for `s` in `33..63`; `32` uses `rotr32*`.
const rotrBH = (h, l, s) => (h << (64 - s)) | (l >>> (s - 32));
// Low 32-bit half of a 64-bit right rotate, valid for `s` in `33..63`; `32` uses `rotr32*`.
const rotrBL = (h, l, s) => (h >>> (s - 32)) | (l << (64 - s));
// High 32-bit half of a 64-bit left rotate, valid for `s` in `1..31`.
const rotlSH = (h, l, s) => (h << s) | (l >>> (32 - s));
// Low 32-bit half of a 64-bit left rotate, valid for `s` in `1..31`.
const rotlSL = (h, l, s) => (l << s) | (h >>> (32 - s));
// High 32-bit half of a 64-bit left rotate, valid for `s` in `33..63`; `32` uses `rotr32*`.
const rotlBH = (h, l, s) => (l << (s - 32)) | (h >>> (64 - s));
// Low 32-bit half of a 64-bit left rotate, valid for `s` in `33..63`; `32` uses `rotr32*`.
const rotlBL = (h, l, s) => (h << (s - 32)) | (l >>> (64 - s));
// Add two split 64-bit words and return the split `{ h, l }` sum.
// JS uses 32-bit signed integers for bitwise operations, so we cannot simply shift the carry out
// of the low sum and instead use division.
function add(Ah, Al, Bh, Bl) {
    const l = (Al >>> 0) + (Bl >>> 0);
    return { h: (Ah + Bh + ((l / 2 ** 32) | 0)) | 0, l: l | 0 };
}
// Addition with more than 2 elements
// Unmasked low-word accumulator for 3-way addition; pass the raw result into `add3H(...)`.
const add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
// High-word finalize step for 3-way addition; `low` must be the untruncated output of `add3L(...)`.
const add3H = (low, Ah, Bh, Ch) => (Ah + Bh + Ch + ((low / 2 ** 32) | 0)) | 0;
// Unmasked low-word accumulator for 4-way addition; pass the raw result into `add4H(...)`.
const add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
// High-word finalize step for 4-way addition; `low` must be the untruncated output of `add4L(...)`.
const add4H = (low, Ah, Bh, Ch, Dh) => (Ah + Bh + Ch + Dh + ((low / 2 ** 32) | 0)) | 0;
// Unmasked low-word accumulator for 5-way addition; pass the raw result into `add5H(...)`.
const add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
// High-word finalize step for 5-way addition; `low` must be the untruncated output of `add5L(...)`.
const add5H = (low, Ah, Bh, Ch, Dh, Eh) => (Ah + Bh + Ch + Dh + Eh + ((low / 2 ** 32) | 0)) | 0;

/**
 * SHA2 hash function. A.k.a. sha256, sha384, sha512, sha512_224, sha512_256.
 * SHA256 is the fastest hash implementable in JS, even faster than Blake3.
 * Check out {@link https://www.rfc-editor.org/rfc/rfc4634 | RFC 4634} and
 * {@link https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf | FIPS 180-4}.
 * @module
 */
// SHA2-512 is slower than sha256 in js because u64 operations are slow.
// SHA-384 / SHA-512 round constants from RFC 6234 §5.2:
// 80 full 64-bit words split into high/low halves.
// prettier-ignore
const K512 = /* @__PURE__ */ (() => split([
    '0x428a2f98d728ae22', '0x7137449123ef65cd', '0xb5c0fbcfec4d3b2f', '0xe9b5dba58189dbbc',
    '0x3956c25bf348b538', '0x59f111f1b605d019', '0x923f82a4af194f9b', '0xab1c5ed5da6d8118',
    '0xd807aa98a3030242', '0x12835b0145706fbe', '0x243185be4ee4b28c', '0x550c7dc3d5ffb4e2',
    '0x72be5d74f27b896f', '0x80deb1fe3b1696b1', '0x9bdc06a725c71235', '0xc19bf174cf692694',
    '0xe49b69c19ef14ad2', '0xefbe4786384f25e3', '0x0fc19dc68b8cd5b5', '0x240ca1cc77ac9c65',
    '0x2de92c6f592b0275', '0x4a7484aa6ea6e483', '0x5cb0a9dcbd41fbd4', '0x76f988da831153b5',
    '0x983e5152ee66dfab', '0xa831c66d2db43210', '0xb00327c898fb213f', '0xbf597fc7beef0ee4',
    '0xc6e00bf33da88fc2', '0xd5a79147930aa725', '0x06ca6351e003826f', '0x142929670a0e6e70',
    '0x27b70a8546d22ffc', '0x2e1b21385c26c926', '0x4d2c6dfc5ac42aed', '0x53380d139d95b3df',
    '0x650a73548baf63de', '0x766a0abb3c77b2a8', '0x81c2c92e47edaee6', '0x92722c851482353b',
    '0xa2bfe8a14cf10364', '0xa81a664bbc423001', '0xc24b8b70d0f89791', '0xc76c51a30654be30',
    '0xd192e819d6ef5218', '0xd69906245565a910', '0xf40e35855771202a', '0x106aa07032bbd1b8',
    '0x19a4c116b8d2d0c8', '0x1e376c085141ab53', '0x2748774cdf8eeb99', '0x34b0bcb5e19b48a8',
    '0x391c0cb3c5c95a63', '0x4ed8aa4ae3418acb', '0x5b9cca4f7763e373', '0x682e6ff3d6b2b8a3',
    '0x748f82ee5defb2fc', '0x78a5636f43172f60', '0x84c87814a1f0ab72', '0x8cc702081a6439ec',
    '0x90befffa23631e28', '0xa4506cebde82bde9', '0xbef9a3f7b2c67915', '0xc67178f2e372532b',
    '0xca273eceea26619c', '0xd186b8c721c0c207', '0xeada7dd6cde0eb1e', '0xf57d4f7fee6ed178',
    '0x06f067aa72176fba', '0x0a637dc5a2c898a6', '0x113f9804bef90dae', '0x1b710b35131c471b',
    '0x28db77f523047d84', '0x32caab7b40c72493', '0x3c9ebe0a15c9bebc', '0x431d67c49c100d4c',
    '0x4cc5d4becb3e42b6', '0x597f299cfc657e2a', '0x5fcb6fab3ad6faec', '0x6c44198c4a475817'
].map(n => BigInt(n))))();
const SHA512_Kh = /* @__PURE__ */ (() => K512[0])();
const SHA512_Kl = /* @__PURE__ */ (() => K512[1])();
// Reusable high-half schedule buffer for the RFC 6234 §6.4 64-bit `W_t` words.
const SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
// Reusable low-half schedule buffer for the RFC 6234 §6.4 64-bit `W_t` words.
const SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
/** Internal SHA-384 / SHA-512 compression engine from RFC 6234 §6.4. */
class SHA2_64B extends HashMD {
    constructor(outputLen) {
        super(128, outputLen, 16, false);
    }
    // prettier-ignore
    get() {
        const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
        return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
    }
    // prettier-ignore
    set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
        this.Ah = Ah | 0;
        this.Al = Al | 0;
        this.Bh = Bh | 0;
        this.Bl = Bl | 0;
        this.Ch = Ch | 0;
        this.Cl = Cl | 0;
        this.Dh = Dh | 0;
        this.Dl = Dl | 0;
        this.Eh = Eh | 0;
        this.El = El | 0;
        this.Fh = Fh | 0;
        this.Fl = Fl | 0;
        this.Gh = Gh | 0;
        this.Gl = Gl | 0;
        this.Hh = Hh | 0;
        this.Hl = Hl | 0;
    }
    process(view, offset) {
        // Extend the first 16 words into the remaining 64 words w[16..79] of the message schedule array
        for (let i = 0; i < 16; i++, offset += 4) {
            SHA512_W_H[i] = view.getUint32(offset);
            SHA512_W_L[i] = view.getUint32((offset += 4));
        }
        for (let i = 16; i < 80; i++) {
            // s0 := (w[i-15] rightrotate 1) xor (w[i-15] rightrotate 8) xor (w[i-15] rightshift 7)
            const W15h = SHA512_W_H[i - 15] | 0;
            const W15l = SHA512_W_L[i - 15] | 0;
            const s0h = rotrSH(W15h, W15l, 1) ^ rotrSH(W15h, W15l, 8) ^ shrSH(W15h, W15l, 7);
            const s0l = rotrSL(W15h, W15l, 1) ^ rotrSL(W15h, W15l, 8) ^ shrSL(W15h, W15l, 7);
            // s1 := (w[i-2] rightrotate 19) xor (w[i-2] rightrotate 61) xor (w[i-2] rightshift 6)
            const W2h = SHA512_W_H[i - 2] | 0;
            const W2l = SHA512_W_L[i - 2] | 0;
            const s1h = rotrSH(W2h, W2l, 19) ^ rotrBH(W2h, W2l, 61) ^ shrSH(W2h, W2l, 6);
            const s1l = rotrSL(W2h, W2l, 19) ^ rotrBL(W2h, W2l, 61) ^ shrSL(W2h, W2l, 6);
            // SHA512_W[i] = s0 + s1 + SHA512_W[i - 7] + SHA512_W[i - 16];
            const SUMl = add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
            const SUMh = add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
            SHA512_W_H[i] = SUMh | 0;
            SHA512_W_L[i] = SUMl | 0;
        }
        let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
        // Compression function main loop, 80 rounds
        for (let i = 0; i < 80; i++) {
            // S1 := (e rightrotate 14) xor (e rightrotate 18) xor (e rightrotate 41)
            const sigma1h = rotrSH(Eh, El, 14) ^ rotrSH(Eh, El, 18) ^ rotrBH(Eh, El, 41);
            const sigma1l = rotrSL(Eh, El, 14) ^ rotrSL(Eh, El, 18) ^ rotrBL(Eh, El, 41);
            //const T1 = (H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i]) | 0;
            const CHIh = (Eh & Fh) ^ (~Eh & Gh);
            const CHIl = (El & Fl) ^ (~El & Gl);
            // T1 = H + sigma1 + Chi(E, F, G) + SHA512_K[i] + SHA512_W[i]
            // prettier-ignore
            const T1ll = add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
            const T1h = add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
            const T1l = T1ll | 0;
            // S0 := (a rightrotate 28) xor (a rightrotate 34) xor (a rightrotate 39)
            const sigma0h = rotrSH(Ah, Al, 28) ^ rotrBH(Ah, Al, 34) ^ rotrBH(Ah, Al, 39);
            const sigma0l = rotrSL(Ah, Al, 28) ^ rotrBL(Ah, Al, 34) ^ rotrBL(Ah, Al, 39);
            const MAJh = (Ah & Bh) ^ (Ah & Ch) ^ (Bh & Ch);
            const MAJl = (Al & Bl) ^ (Al & Cl) ^ (Bl & Cl);
            Hh = Gh | 0;
            Hl = Gl | 0;
            Gh = Fh | 0;
            Gl = Fl | 0;
            Fh = Eh | 0;
            Fl = El | 0;
            ({ h: Eh, l: El } = add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
            Dh = Ch | 0;
            Dl = Cl | 0;
            Ch = Bh | 0;
            Cl = Bl | 0;
            Bh = Ah | 0;
            Bl = Al | 0;
            const All = add3L(T1l, sigma0l, MAJl);
            Ah = add3H(All, T1h, sigma0h, MAJh);
            Al = All | 0;
        }
        // Add the compressed chunk to the current hash value
        ({ h: Ah, l: Al } = add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
        ({ h: Bh, l: Bl } = add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
        ({ h: Ch, l: Cl } = add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
        ({ h: Dh, l: Dl } = add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
        ({ h: Eh, l: El } = add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
        ({ h: Fh, l: Fl } = add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
        ({ h: Gh, l: Gl } = add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
        ({ h: Hh, l: Hl } = add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
        this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
    }
    roundClean() {
        clean$1(SHA512_W_H, SHA512_W_L);
    }
    destroy() {
        // HashMD callers route post-destroy usability through `destroyed`; zeroizing alone still leaves
        // update()/digest() callable on reused instances.
        this.destroyed = true;
        clean$1(this.buffer);
        this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
}
/** Internal SHA-512 hash class grounded in RFC 6234 §6.3 and §6.4. */
class _SHA512 extends SHA2_64B {
    Ah = SHA512_IV[0] | 0;
    Al = SHA512_IV[1] | 0;
    Bh = SHA512_IV[2] | 0;
    Bl = SHA512_IV[3] | 0;
    Ch = SHA512_IV[4] | 0;
    Cl = SHA512_IV[5] | 0;
    Dh = SHA512_IV[6] | 0;
    Dl = SHA512_IV[7] | 0;
    Eh = SHA512_IV[8] | 0;
    El = SHA512_IV[9] | 0;
    Fh = SHA512_IV[10] | 0;
    Fl = SHA512_IV[11] | 0;
    Gh = SHA512_IV[12] | 0;
    Gl = SHA512_IV[13] | 0;
    Hh = SHA512_IV[14] | 0;
    Hl = SHA512_IV[15] | 0;
    constructor() {
        super(64);
    }
}
/**
 * SHA2-512 hash function from RFC 4634.
 * @param msg - message bytes to hash
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA2-512.
 * ```ts
 * sha512(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha512 = /* @__PURE__ */ createHasher(() => new _SHA512(), 
/* @__PURE__ */ oidNist(0x03));

/**
 * Hex, bytes and number utilities.
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
/**
 * Validates that a value is a byte array.
 * @param value - Value to validate.
 * @param length - Optional exact byte length.
 * @param title - Optional field name.
 * @returns Original byte array.
 * @example
 * Reject non-byte input before passing data into curve code.
 *
 * ```ts
 * abytes(new Uint8Array(1));
 * ```
 */
const abytes$1 = (value, length, title) => abytes$2(value, length, title);
/**
 * Validates that a value is a non-negative safe integer.
 * @param n - Value to validate.
 * @param title - Optional field name.
 * @example
 * Validate a numeric length before allocating buffers.
 *
 * ```ts
 * anumber(1);
 * ```
 */
const anumber$1 = anumber$2;
/**
 * Encodes bytes as lowercase hex.
 * @param bytes - Bytes to encode.
 * @returns Lowercase hex string.
 * @example
 * Serialize bytes as hex for logging or fixtures.
 *
 * ```ts
 * bytesToHex(Uint8Array.of(1, 2, 3));
 * ```
 */
const bytesToHex = bytesToHex$1;
/**
 * Concatenates byte arrays.
 * @param arrays - Byte arrays to join.
 * @returns Concatenated bytes.
 * @example
 * Join domain-separated chunks into one buffer.
 *
 * ```ts
 * concatBytes(Uint8Array.of(1), Uint8Array.of(2));
 * ```
 */
const concatBytes = (...arrays) => concatBytes$1(...arrays);
/**
 * Decodes lowercase or uppercase hex into bytes.
 * @param hex - Hex string to decode.
 * @returns Decoded bytes.
 * @example
 * Parse fixture hex into bytes before hashing.
 *
 * ```ts
 * hexToBytes('0102');
 * ```
 */
const hexToBytes = (hex) => hexToBytes$1(hex);
/**
 * Checks whether a value is a Uint8Array.
 * @param a - Value to inspect.
 * @returns `true` when `a` is a Uint8Array.
 * @example
 * Branch on byte input before decoding it.
 *
 * ```ts
 * isBytes(new Uint8Array(1));
 * ```
 */
const isBytes$1 = isBytes$2;
/**
 * Reads random bytes from the platform CSPRNG.
 * @param bytesLength - Number of random bytes to read.
 * @returns Fresh random bytes.
 * @example
 * Generate a random seed for a keypair.
 *
 * ```ts
 * randomBytes(2);
 * ```
 */
const randomBytes$2 = (bytesLength) => randomBytes$3(bytesLength);
const _0n$6 = /* @__PURE__ */ BigInt(0);
const _1n$6 = /* @__PURE__ */ BigInt(1);
/**
 * Validates that a flag is boolean.
 * @param value - Value to validate.
 * @param title - Optional field name.
 * @returns Original value.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Reject non-boolean option flags early.
 *
 * ```ts
 * abool(true);
 * ```
 */
function abool$1(value, title = '') {
    if (typeof value !== 'boolean') {
        const prefix = title && `"${title}" `;
        throw new TypeError(prefix + 'expected boolean, got type=' + typeof value);
    }
    return value;
}
/**
 * Validates that a value is a non-negative bigint or safe integer.
 * @param n - Value to validate.
 * @returns The same validated value.
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Validate one integer-like value before serializing it.
 *
 * ```ts
 * abignumber(1n);
 * ```
 */
function abignumber(n) {
    if (typeof n === 'bigint') {
        if (!isPosBig(n))
            throw new RangeError('positive bigint expected, got ' + n);
    }
    else
        anumber$1(n);
    return n;
}
/**
 * Validates that a value is a safe integer.
 * @param value - Integer to validate.
 * @param title - Optional field name.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Validate a window size before scalar arithmetic uses it.
 *
 * ```ts
 * asafenumber(1);
 * ```
 */
function asafenumber(value, title = '') {
    if (typeof value !== 'number') {
        const prefix = title && `"${title}" `;
        throw new TypeError(prefix + 'expected number, got type=' + typeof value);
    }
    if (!Number.isSafeInteger(value)) {
        const prefix = title && `"${title}" `;
        throw new RangeError(prefix + 'expected safe integer, got ' + value);
    }
}
/**
 * Parses a big-endian hex string into bigint.
 * Accepts odd-length hex through the native `BigInt('0x' + hex)` parser and currently surfaces the
 * same native `SyntaxError` for malformed hex instead of wrapping it in a library-specific error.
 * @param hex - Hex string without `0x`.
 * @returns Parsed bigint value.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Parse a scalar from fixture hex.
 *
 * ```ts
 * hexToNumber('ff');
 * ```
 */
function hexToNumber$1(hex) {
    if (typeof hex !== 'string')
        throw new TypeError('hex string expected, got ' + typeof hex);
    return hex === '' ? _0n$6 : BigInt('0x' + hex); // Big Endian
}
// BE: Big Endian, LE: Little Endian
/**
 * Parses big-endian bytes into bigint.
 * @param bytes - Bytes in big-endian order.
 * @returns Parsed bigint value.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Read a scalar encoded in network byte order.
 *
 * ```ts
 * bytesToNumberBE(Uint8Array.of(1, 0));
 * ```
 */
function bytesToNumberBE$1(bytes) {
    return hexToNumber$1(bytesToHex$1(bytes));
}
/**
 * Parses little-endian bytes into bigint.
 * @param bytes - Bytes in little-endian order.
 * @returns Parsed bigint value.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Read a scalar encoded in little-endian form.
 *
 * ```ts
 * bytesToNumberLE(Uint8Array.of(1, 0));
 * ```
 */
function bytesToNumberLE(bytes) {
    return hexToNumber$1(bytesToHex$1(copyBytes$2(abytes$2(bytes)).reverse()));
}
/**
 * Encodes a bigint into fixed-length big-endian bytes.
 * @param n - Number to encode.
 * @param len - Output length in bytes. Must be greater than zero.
 * @returns Big-endian byte array.
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Serialize a scalar into a 32-byte field element.
 *
 * ```ts
 * numberToBytesBE(255n, 2);
 * ```
 */
function numberToBytesBE$1(n, len) {
    anumber$2(len);
    if (len === 0)
        throw new RangeError('zero length');
    n = abignumber(n);
    const hex = n.toString(16);
    // Detect overflow before hex parsing so oversized values don't leak the shared odd-hex error.
    if (hex.length > len * 2)
        throw new RangeError('number too large');
    return hexToBytes$1(hex.padStart(len * 2, '0'));
}
/**
 * Encodes a bigint into fixed-length little-endian bytes.
 * @param n - Number to encode.
 * @param len - Output length in bytes.
 * @returns Little-endian byte array.
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Serialize a scalar for little-endian protocols.
 *
 * ```ts
 * numberToBytesLE(255n, 2);
 * ```
 */
function numberToBytesLE(n, len) {
    return numberToBytesBE$1(n, len).reverse();
}
// Compares 2 u8a-s in kinda constant time
/**
 * Compares two byte arrays in constant-ish time.
 * @param a - Left byte array.
 * @param b - Right byte array.
 * @returns `true` when bytes match.
 * @example
 * Compare two encoded points without early exit.
 *
 * ```ts
 * equalBytes(Uint8Array.of(1), Uint8Array.of(1));
 * ```
 */
function equalBytes$2(a, b) {
    a = abytes$1(a);
    b = abytes$1(b);
    if (a.length !== b.length)
        return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++)
        diff |= a[i] ^ b[i];
    return diff === 0;
}
/**
 * Copies Uint8Array. We can't use u8a.slice(), because u8a can be Buffer,
 * and Buffer#slice creates mutable copy. Never use Buffers!
 * @param bytes - Bytes to copy.
 * @returns Detached copy.
 * @example
 * Make an isolated copy before mutating serialized bytes.
 *
 * ```ts
 * copyBytes(Uint8Array.of(1, 2, 3));
 * ```
 */
function copyBytes$2(bytes) {
    // `Uint8Array.from(...)` would also accept arrays / other typed arrays. Keep this helper strict
    // because callers use it at byte-validation boundaries before mutating the detached copy.
    return Uint8Array.from(abytes$1(bytes));
}
// Historical name: this accepts non-negative bigints, including zero.
const isPosBig = (n) => typeof n === 'bigint' && _0n$6 <= n;
/**
 * Checks whether a bigint lies inside a half-open range.
 * @param n - Candidate value.
 * @param min - Inclusive lower bound.
 * @param max - Exclusive upper bound.
 * @returns `true` when the value is inside the range.
 * @example
 * Check whether a candidate scalar fits the field order.
 *
 * ```ts
 * inRange(2n, 1n, 3n);
 * ```
 */
function inRange(n, min, max) {
    return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
}
/**
 * Asserts `min <= n < max`. NOTE: upper bound is exclusive.
 * @param title - Value label for error messages.
 * @param n - Candidate value.
 * @param min - Inclusive lower bound.
 * @param max - Exclusive upper bound.
 * Wrong-type inputs are not separated from out-of-range values here: they still flow through the
 * shared `RangeError` path because this is only a throwing wrapper around `inRange(...)`.
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Assert that a bigint stays within one half-open range.
 *
 * ```ts
 * aInRange('x', 2n, 1n, 256n);
 * ```
 */
function aInRange(title, n, min, max) {
    // Why min <= n < max and not a (min < n < max) OR b (min <= n <= max)?
    // consider P=256n, min=0n, max=P
    // - a for min=0 would require -1:          `inRange('x', x, -1n, P)`
    // - b would commonly require subtraction:  `inRange('x', x, 0n, P - 1n)`
    // - our way is the cleanest:               `inRange('x', x, 0n, P)
    if (!inRange(n, min, max))
        throw new RangeError('expected valid ' + title + ': ' + min + ' <= n < ' + max + ', got ' + n);
}
// Bit operations
/**
 * Calculates amount of bits in a bigint.
 * Same as `n.toString(2).length`
 * TODO: merge with nLength in modular
 * @param n - Value to inspect.
 * @returns Bit length.
 * @throws If the value is negative. {@link Error}
 * @example
 * Measure the bit length of a scalar before serialization.
 *
 * ```ts
 * bitLen(8n);
 * ```
 */
function bitLen(n) {
    // Size callers in this repo only use non-negative orders / scalars, so negative inputs are a
    // contract bug and must not silently collapse to zero bits.
    if (n < _0n$6)
        throw new Error('expected non-negative bigint, got ' + n);
    let len;
    for (len = 0; n > _0n$6; n >>= _1n$6, len += 1)
        ;
    return len;
}
/**
 * Calculate mask for N bits. Not using ** operator with bigints because of old engines.
 * Same as BigInt(`0b${Array(i).fill('1').join('')}`)
 * @param n - Number of bits. Negative widths are currently passed through to raw bigint shift
 *   semantics and therefore produce `-1n`.
 * @returns Bitmask value.
 * @example
 * Calculate mask for N bits.
 *
 * ```ts
 * bitMask(4);
 * ```
 */
const bitMask = (n) => (_1n$6 << BigInt(n)) - _1n$6;
/**
 * Validates declared required and optional field types on a plain object.
 * Extra keys are intentionally ignored because many callers validate only the subset they use from
 * richer option bags or runtime objects.
 * @param object - Object to validate.
 * @param fields - Required field types.
 * @param optFields - Optional field types.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Check user options before building a curve helper.
 *
 * ```ts
 * validateObject({ flag: true }, { flag: 'boolean' });
 * ```
 */
function validateObject(object, fields = {}, optFields = {}) {
    if (Object.prototype.toString.call(object) !== '[object Object]')
        throw new TypeError('expected valid options object');
    function checkField(fieldName, expectedType, isOpt) {
        // Config/data fields must be explicit own properties, but runtime objects such as Field
        // instances intentionally satisfy required method slots via their shared prototype.
        if (!isOpt && expectedType !== 'function' && !Object.hasOwn(object, fieldName))
            throw new TypeError(`param "${fieldName}" is invalid: expected own property`);
        const val = object[fieldName];
        if (isOpt && val === undefined)
            return;
        const current = typeof val;
        if (current !== expectedType || val === null)
            throw new TypeError(`param "${fieldName}" is invalid: expected ${expectedType}, got ${current}`);
    }
    const iter = (f, isOpt) => Object.entries(f).forEach(([k, v]) => checkField(k, v, isOpt));
    iter(fields, false);
    iter(optFields, true);
}
/**
 * Throws not implemented error.
 * @returns Never returns.
 * @throws If the unfinished code path is reached. {@link Error}
 * @example
 * Surface the placeholder error from an unfinished code path.
 *
 * ```ts
 * try {
 *   notImplemented();
 * } catch {}
 * ```
 */
const notImplemented = () => {
    throw new Error('not implemented');
};

/**
 * Utils for modular division and fields.
 * Field over 11 is a finite (Galois) field is integer number operations `mod 11`.
 * There is no division: it is replaced by modular multiplicative inverse.
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
// Numbers aren't used in x25519 / x448 builds
// prettier-ignore
const _0n$5 = /* @__PURE__ */ BigInt(0), _1n$5 = /* @__PURE__ */ BigInt(1), _2n$4 = /* @__PURE__ */ BigInt(2);
// prettier-ignore
const _3n$1 = /* @__PURE__ */ BigInt(3), _4n = /* @__PURE__ */ BigInt(4), _5n$1 = /* @__PURE__ */ BigInt(5);
// prettier-ignore
const _7n$1 = /* @__PURE__ */ BigInt(7), _8n$3 = /* @__PURE__ */ BigInt(8), _9n = /* @__PURE__ */ BigInt(9);
const _16n = /* @__PURE__ */ BigInt(16);
/**
 * @param a - Dividend value.
 * @param b - Positive modulus.
 * @returns Reduced value in `[0, b)` only when `b` is positive.
 * @throws If the modulus is not positive. {@link Error}
 * @example
 * Normalize a bigint into one field residue.
 *
 * ```ts
 * mod(-1n, 5n);
 * ```
 */
function mod(a, b) {
    if (b <= _0n$5)
        throw new Error('mod: expected positive modulus, got ' + b);
    const result = a % b;
    return result >= _0n$5 ? result : b + result;
}
/**
 * Does `x^(2^power)` mod p. `pow2(30, 4)` == `30^(2^4)`.
 * Low-level helper: callers that need canonical residues must pass a valid `x` for the chosen
 * modulus; the `power===0` fast path intentionally returns the input unchanged.
 * @param x - Base value.
 * @param power - Number of squarings.
 * @param modulo - Reduction modulus.
 * @returns Repeated-squaring result.
 * @throws If the exponent is negative. {@link Error}
 * @example
 * Apply repeated squaring inside one field.
 *
 * ```ts
 * pow2(3n, 2n, 11n);
 * ```
 */
function pow2(x, power, modulo) {
    if (power < _0n$5)
        throw new Error('pow2: expected non-negative exponent, got ' + power);
    let res = x;
    while (power-- > _0n$5) {
        res *= res;
        res %= modulo;
    }
    return res;
}
/**
 * Inverses number over modulo.
 * Implemented using the {@link https://brilliant.org/wiki/extended-euclidean-algorithm/ | extended Euclidean algorithm}.
 * @param number - Value to invert.
 * @param modulo - Positive modulus.
 * @returns Multiplicative inverse.
 * @throws If the modulus is invalid or the inverse does not exist. {@link Error}
 * @example
 * Compute one modular inverse with the extended Euclidean algorithm.
 *
 * ```ts
 * invert(3n, 11n);
 * ```
 */
function invert(number, modulo) {
    if (number === _0n$5)
        throw new Error('invert: expected non-zero number');
    if (modulo <= _0n$5)
        throw new Error('invert: expected positive modulus, got ' + modulo);
    // Fermat's little theorem "CT-like" version inv(n) = n^(m-2) mod m is 30x slower.
    let a = mod(number, modulo);
    let b = modulo;
    // prettier-ignore
    let x = _0n$5, u = _1n$5;
    while (a !== _0n$5) {
        const q = b / a;
        const r = b - a * q;
        const m = x - u * q;
        // prettier-ignore
        b = a, a = r, x = u, u = m;
    }
    const gcd = b;
    if (gcd !== _1n$5)
        throw new Error('invert: does not exist');
    return mod(x, modulo);
}
function assertIsSquare(Fp, root, n) {
    const F = Fp;
    if (!F.eql(F.sqr(root), n))
        throw new Error('Cannot find square root');
}
// Not all roots are possible! Example which will throw:
// const NUM =
// n = 72057594037927816n;
// Fp = Field(BigInt('0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaab'));
function sqrt3mod4(Fp, n) {
    const F = Fp;
    const p1div4 = (F.ORDER + _1n$5) / _4n;
    const root = F.pow(n, p1div4);
    assertIsSquare(F, root, n);
    return root;
}
// Equivalent `q = 5 (mod 8)` square-root formula (Atkin-style), not the RFC Appendix I.2 CMOV
// pseudocode verbatim.
function sqrt5mod8(Fp, n) {
    const F = Fp;
    const p5div8 = (F.ORDER - _5n$1) / _8n$3;
    const n2 = F.mul(n, _2n$4);
    const v = F.pow(n2, p5div8);
    const nv = F.mul(n, v);
    const i = F.mul(F.mul(nv, _2n$4), v);
    const root = F.mul(nv, F.sub(i, F.ONE));
    assertIsSquare(F, root, n);
    return root;
}
// Based on RFC9380, Kong algorithm
// prettier-ignore
function sqrt9mod16(P) {
    const Fp_ = Field(P);
    const tn = tonelliShanks(P);
    const c1 = tn(Fp_, Fp_.neg(Fp_.ONE)); //  1. c1 = sqrt(-1) in F, i.e., (c1^2) == -1 in F
    const c2 = tn(Fp_, c1); //  2. c2 = sqrt(c1) in F, i.e., (c2^2) == c1 in F
    const c3 = tn(Fp_, Fp_.neg(c1)); //  3. c3 = sqrt(-c1) in F, i.e., (c3^2) == -c1 in F
    const c4 = (P + _7n$1) / _16n; //  4. c4 = (q + 7) / 16        # Integer arithmetic
    return ((Fp, n) => {
        const F = Fp;
        let tv1 = F.pow(n, c4); //  1. tv1 = x^c4
        let tv2 = F.mul(tv1, c1); //  2. tv2 = c1 * tv1
        const tv3 = F.mul(tv1, c2); //  3. tv3 = c2 * tv1
        const tv4 = F.mul(tv1, c3); //  4. tv4 = c3 * tv1
        const e1 = F.eql(F.sqr(tv2), n); //  5.  e1 = (tv2^2) == x
        const e2 = F.eql(F.sqr(tv3), n); //  6.  e2 = (tv3^2) == x
        tv1 = F.cmov(tv1, tv2, e1); //  7. tv1 = CMOV(tv1, tv2, e1)  # Select tv2 if (tv2^2) == x
        tv2 = F.cmov(tv4, tv3, e2); //  8. tv2 = CMOV(tv4, tv3, e2)  # Select tv3 if (tv3^2) == x
        const e3 = F.eql(F.sqr(tv2), n); //  9.  e3 = (tv2^2) == x
        const root = F.cmov(tv1, tv2, e3); // 10.  z = CMOV(tv1, tv2, e3)   # Select sqrt from tv1 & tv2
        assertIsSquare(F, root, n);
        return root;
    });
}
/**
 * Tonelli-Shanks square root search algorithm.
 * This implementation is variable-time: it searches data-dependently for the first non-residue `Z`
 * and for the smallest `i` in the main loop, unlike RFC 9380 Appendix I.4's constant-time shape.
 * 1. {@link https://eprint.iacr.org/2012/685.pdf | eprint 2012/685}, page 12
 * 2. Square Roots from 1; 24, 51, 10 to Dan Shanks
 * @param P - field order
 * @returns function that takes field Fp (created from P) and number n
 * @throws If the field is too small, non-prime, or the square root does not exist. {@link Error}
 * @example
 * Construct a square-root helper for primes that need Tonelli-Shanks.
 *
 * ```ts
 * import { Field, tonelliShanks } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const sqrt = tonelliShanks(17n)(Fp, 4n);
 * ```
 */
function tonelliShanks(P) {
    // Initialization (precomputation).
    // Caching initialization could boost perf by 7%.
    if (P < _3n$1)
        throw new Error('sqrt is not defined for small field');
    // Factor P - 1 = Q * 2^S, where Q is odd
    let Q = P - _1n$5;
    let S = 0;
    while (Q % _2n$4 === _0n$5) {
        Q /= _2n$4;
        S++;
    }
    // Find the first quadratic non-residue Z >= 2
    let Z = _2n$4;
    const _Fp = Field(P);
    while (FpLegendre(_Fp, Z) === 1) {
        // Basic primality test for P. After x iterations, chance of
        // not finding quadratic non-residue is 2^x, so 2^1000.
        if (Z++ > 1000)
            throw new Error('Cannot find square root: probably non-prime P');
    }
    // Fast-path; usually done before Z, but we do "primality test".
    if (S === 1)
        return sqrt3mod4;
    // Slow-path
    // TODO: test on Fp2 and others
    let cc = _Fp.pow(Z, Q); // c = z^Q
    const Q1div2 = (Q + _1n$5) / _2n$4;
    return function tonelliSlow(Fp, n) {
        const F = Fp;
        if (F.is0(n))
            return n;
        // Check if n is a quadratic residue using Legendre symbol
        if (FpLegendre(F, n) !== 1)
            throw new Error('Cannot find square root');
        // Initialize variables for the main loop
        let M = S;
        let c = F.mul(F.ONE, cc); // c = z^Q, move cc from field _Fp into field Fp
        let t = F.pow(n, Q); // t = n^Q, first guess at the fudge factor
        let R = F.pow(n, Q1div2); // R = n^((Q+1)/2), first guess at the square root
        // Main loop
        // while t != 1
        while (!F.eql(t, F.ONE)) {
            if (F.is0(t))
                return F.ZERO; // if t=0 return R=0
            let i = 1;
            // Find the smallest i >= 1 such that t^(2^i) ≡ 1 (mod P)
            let t_tmp = F.sqr(t); // t^(2^1)
            while (!F.eql(t_tmp, F.ONE)) {
                i++;
                t_tmp = F.sqr(t_tmp); // t^(2^2)...
                if (i === M)
                    throw new Error('Cannot find square root');
            }
            // Calculate the exponent for b: 2^(M - i - 1)
            const exponent = _1n$5 << BigInt(M - i - 1); // bigint is important
            const b = F.pow(c, exponent); // b = 2^(M - i - 1)
            // Update variables
            M = i;
            c = F.sqr(b); // c = b^2
            t = F.mul(t, c); // t = (t * b^2)
            R = F.mul(R, b); // R = R*b
        }
        return R;
    };
}
/**
 * Square root for a finite field. Will try optimized versions first:
 *
 * 1. P ≡ 3 (mod 4)
 * 2. P ≡ 5 (mod 8)
 * 3. P ≡ 9 (mod 16)
 * 4. Tonelli-Shanks algorithm
 *
 * Different algorithms can give different roots, it is up to user to decide which one they want.
 * For example there is FpSqrtOdd/FpSqrtEven to choose a root by oddness
 * (used for hash-to-curve).
 * @param P - Field order.
 * @returns Square-root helper. The generic fallback inherits Tonelli-Shanks' variable-time
 *   behavior and this selector assumes prime-field-style integer moduli.
 * @throws If the field is unsupported or the square root does not exist. {@link Error}
 * @example
 * Choose the square-root helper appropriate for one field modulus.
 *
 * ```ts
 * import { Field, FpSqrt } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const sqrt = FpSqrt(17n)(Fp, 4n);
 * ```
 */
function FpSqrt(P) {
    // P ≡ 3 (mod 4) => √n = n^((P+1)/4)
    if (P % _4n === _3n$1)
        return sqrt3mod4;
    // P ≡ 5 (mod 8) => Atkin algorithm, page 10 of https://eprint.iacr.org/2012/685.pdf
    if (P % _8n$3 === _5n$1)
        return sqrt5mod8;
    // P ≡ 9 (mod 16) => Kong algorithm, page 11 of https://eprint.iacr.org/2012/685.pdf (algorithm 4)
    if (P % _16n === _9n)
        return sqrt9mod16(P);
    // Tonelli-Shanks algorithm
    return tonelliShanks(P);
}
/**
 * @param num - Value to inspect.
 * @param modulo - Field modulus.
 * @returns `true` when the least-significant little-endian bit is set.
 * @throws If the modulus is invalid for `mod(...)`. {@link Error}
 * @example
 * Inspect the low bit used by little-endian sign conventions.
 *
 * ```ts
 * isNegativeLE(3n, 11n);
 * ```
 */
const isNegativeLE = (num, modulo) => (mod(num, modulo) & _1n$5) === _1n$5;
// prettier-ignore
// Arithmetic-only subset checked by validateField(). This is intentionally not the full runtime
// IField contract: helpers like `isValidNot0`, `invertBatch`, `toBytes`, `fromBytes`, `cmov`, and
// field-specific extras like `isOdd` are left to the callers that actually need them.
const FIELD_FIELDS = [
    'create', 'isValid', 'is0', 'neg', 'inv', 'sqrt', 'sqr',
    'eql', 'add', 'sub', 'mul', 'pow', 'div',
    'addN', 'subN', 'mulN', 'sqrN'
];
/**
 * @param field - Field implementation.
 * @returns Validated field. This only checks the arithmetic subset needed by generic helpers; it
 *   does not guarantee full runtime-method coverage for serialization, batching, `cmov`, or
 *   field-specific extras beyond positive `BYTES` / `BITS`.
 * @throws If the field shape or numeric metadata are invalid. {@link Error}
 * @example
 * Check that a field implementation exposes the operations curve code expects.
 *
 * ```ts
 * import { Field, validateField } from '@noble/curves/abstract/modular.js';
 * const Fp = validateField(Field(17n));
 * ```
 */
function validateField(field) {
    const initial = {
        ORDER: 'bigint',
        BYTES: 'number',
        BITS: 'number',
    };
    const opts = FIELD_FIELDS.reduce((map, val) => {
        map[val] = 'function';
        return map;
    }, initial);
    validateObject(field, opts);
    // Runtime field implementations must expose real integer byte/bit sizes; fractional / NaN /
    // infinite metadata leaks through validateObject(type='number') but breaks encoders and caches.
    asafenumber(field.BYTES, 'BYTES');
    asafenumber(field.BITS, 'BITS');
    // Runtime field implementations must expose positive byte/bit sizes; zero leaks through the
    // numeric shape checks above but still breaks encoding helpers and cached-length assumptions.
    if (field.BYTES < 1 || field.BITS < 1)
        throw new Error('invalid field: expected BYTES/BITS > 0');
    if (field.ORDER <= _1n$5)
        throw new Error('invalid field: expected ORDER > 1, got ' + field.ORDER);
    return field;
}
// Generic field functions
/**
 * Same as `pow` but for Fp: non-constant-time.
 * Unsafe in some contexts: uses ladder, so can expose bigint bits.
 * @param Fp - Field implementation.
 * @param num - Base value.
 * @param power - Exponent value.
 * @returns Powered field element.
 * @throws If the exponent is negative. {@link Error}
 * @example
 * Raise one field element to a public exponent.
 *
 * ```ts
 * import { Field, FpPow } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const x = FpPow(Fp, 3n, 5n);
 * ```
 */
function FpPow(Fp, num, power) {
    const F = Fp;
    if (power < _0n$5)
        throw new Error('invalid exponent, negatives unsupported');
    if (power === _0n$5)
        return F.ONE;
    if (power === _1n$5)
        return num;
    let p = F.ONE;
    let d = num;
    while (power > _0n$5) {
        if (power & _1n$5)
            p = F.mul(p, d);
        d = F.sqr(d);
        power >>= _1n$5;
    }
    return p;
}
/**
 * Efficiently invert an array of Field elements.
 * Exception-free. Zero-valued field elements stay `undefined` unless `passZero` is enabled.
 * @param Fp - Field implementation.
 * @param nums - Values to invert.
 * @param passZero - map 0 to 0 (instead of undefined)
 * @returns Inverted values.
 * @example
 * Invert several field elements with one shared inversion.
 *
 * ```ts
 * import { Field, FpInvertBatch } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const inv = FpInvertBatch(Fp, [1n, 2n, 4n]);
 * ```
 */
function FpInvertBatch(Fp, nums, passZero = false) {
    const F = Fp;
    const inverted = new Array(nums.length).fill(passZero ? F.ZERO : undefined);
    // Walk from first to last, multiply them by each other MOD p
    const multipliedAcc = nums.reduce((acc, num, i) => {
        if (F.is0(num))
            return acc;
        inverted[i] = acc;
        return F.mul(acc, num);
    }, F.ONE);
    // Invert last element
    const invertedAcc = F.inv(multipliedAcc);
    // Walk from last to first, multiply them by inverted each other MOD p
    nums.reduceRight((acc, num, i) => {
        if (F.is0(num))
            return acc;
        inverted[i] = F.mul(acc, inverted[i]);
        return F.mul(acc, num);
    }, invertedAcc);
    return inverted;
}
/**
 * Legendre symbol.
 * Legendre constant is used to calculate Legendre symbol (a | p)
 * which denotes the value of a^((p-1)/2) (mod p).
 *
 * * (a | p) ≡ 1    if a is a square (mod p), quadratic residue
 * * (a | p) ≡ -1   if a is not a square (mod p), quadratic non residue
 * * (a | p) ≡ 0    if a ≡ 0 (mod p)
 * @param Fp - Field implementation.
 * @param n - Value to inspect.
 * @returns Legendre symbol.
 * @throws If the field returns an invalid Legendre symbol value. {@link Error}
 * @example
 * Compute the Legendre symbol of one field element.
 *
 * ```ts
 * import { Field, FpLegendre } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const symbol = FpLegendre(Fp, 4n);
 * ```
 */
function FpLegendre(Fp, n) {
    const F = Fp;
    // We can use 3rd argument as optional cache of this value
    // but seems unneeded for now. The operation is very fast.
    const p1mod2 = (F.ORDER - _1n$5) / _2n$4;
    const powered = F.pow(n, p1mod2);
    const yes = F.eql(powered, F.ONE);
    const zero = F.eql(powered, F.ZERO);
    const no = F.eql(powered, F.neg(F.ONE));
    if (!yes && !zero && !no)
        throw new Error('invalid Legendre symbol result');
    return yes ? 1 : zero ? 0 : -1;
}
/**
 * @param n - Curve order. Callers are expected to pass a positive order.
 * @param nBitLength - Optional cached bit length. Callers are expected to pass a positive cached
 *   value when overriding the derived bit length.
 * @returns Byte and bit lengths.
 * @throws If the order or cached bit length is invalid. {@link Error}
 * @example
 * Measure the encoding sizes needed for one modulus.
 *
 * ```ts
 * nLength(255n);
 * ```
 */
function nLength(n, nBitLength) {
    // Bit size, byte size of CURVE.n
    if (nBitLength !== undefined)
        anumber$1(nBitLength);
    if (n <= _0n$5)
        throw new Error('invalid n length: expected positive n, got ' + n);
    if (nBitLength !== undefined && nBitLength < 1)
        throw new Error('invalid n length: expected positive bit length, got ' + nBitLength);
    const bits = bitLen(n);
    // Cached bit lengths smaller than ORDER would truncate serialized scalars/elements and poison
    // any math that relies on the derived field metadata.
    if (nBitLength !== undefined && nBitLength < bits)
        throw new Error(`invalid n length: expected bit length (${bits}) >= n.length (${nBitLength})`);
    const _nBitLength = nBitLength !== undefined ? nBitLength : bits;
    const nByteLength = Math.ceil(_nBitLength / 8);
    return { nBitLength: _nBitLength, nByteLength };
}
// Keep the lazy sqrt cache off-instance so Field(...) can return a frozen object. Otherwise the
// cached helper write would keep the field surface externally mutable.
const FIELD_SQRT = new WeakMap();
class _Field {
    ORDER;
    BITS;
    BYTES;
    isLE;
    ZERO = _0n$5;
    ONE = _1n$5;
    _lengths;
    _mod;
    constructor(ORDER, opts = {}) {
        // ORDER <= 1 is degenerate: ONE would not be a valid field element and helpers like pow/inv
        // would stop modeling field arithmetic.
        if (ORDER <= _1n$5)
            throw new Error('invalid field: expected ORDER > 1, got ' + ORDER);
        let _nbitLength = undefined;
        this.isLE = false;
        if (opts != null && typeof opts === 'object') {
            // Cached bit lengths are trusted here and should already be positive / consistent with ORDER.
            if (typeof opts.BITS === 'number')
                _nbitLength = opts.BITS;
            if (typeof opts.sqrt === 'function')
                // `_Field.prototype` is frozen below, so custom sqrt hooks must become own properties
                // explicitly instead of relying on writable prototype shadowing via assignment.
                Object.defineProperty(this, 'sqrt', { value: opts.sqrt, enumerable: true });
            if (typeof opts.isLE === 'boolean')
                this.isLE = opts.isLE;
            if (opts.allowedLengths)
                this._lengths = Object.freeze(opts.allowedLengths.slice());
            if (typeof opts.modFromBytes === 'boolean')
                this._mod = opts.modFromBytes;
        }
        const { nBitLength, nByteLength } = nLength(ORDER, _nbitLength);
        if (nByteLength > 2048)
            throw new Error('invalid field: expected ORDER of <= 2048 bytes');
        this.ORDER = ORDER;
        this.BITS = nBitLength;
        this.BYTES = nByteLength;
        Object.freeze(this);
    }
    create(num) {
        return mod(num, this.ORDER);
    }
    isValid(num) {
        if (typeof num !== 'bigint')
            throw new TypeError('invalid field element: expected bigint, got ' + typeof num);
        return _0n$5 <= num && num < this.ORDER; // 0 is valid element, but it's not invertible
    }
    is0(num) {
        return num === _0n$5;
    }
    // is valid and invertible
    isValidNot0(num) {
        return !this.is0(num) && this.isValid(num);
    }
    isOdd(num) {
        return (num & _1n$5) === _1n$5;
    }
    neg(num) {
        return mod(-num, this.ORDER);
    }
    eql(lhs, rhs) {
        return lhs === rhs;
    }
    sqr(num) {
        return mod(num * num, this.ORDER);
    }
    add(lhs, rhs) {
        return mod(lhs + rhs, this.ORDER);
    }
    sub(lhs, rhs) {
        return mod(lhs - rhs, this.ORDER);
    }
    mul(lhs, rhs) {
        return mod(lhs * rhs, this.ORDER);
    }
    pow(num, power) {
        return FpPow(this, num, power);
    }
    div(lhs, rhs) {
        return mod(lhs * invert(rhs, this.ORDER), this.ORDER);
    }
    // Same as above, but doesn't normalize
    sqrN(num) {
        return num * num;
    }
    addN(lhs, rhs) {
        return lhs + rhs;
    }
    subN(lhs, rhs) {
        return lhs - rhs;
    }
    mulN(lhs, rhs) {
        return lhs * rhs;
    }
    inv(num) {
        return invert(num, this.ORDER);
    }
    sqrt(num) {
        // Caching sqrt helpers speeds up sqrt9mod16 by 5x and Tonelli-Shanks by about 10% without keeping
        // the field instance itself mutable.
        let sqrt = FIELD_SQRT.get(this);
        if (!sqrt)
            FIELD_SQRT.set(this, (sqrt = FpSqrt(this.ORDER)));
        return sqrt(this, num);
    }
    toBytes(num) {
        // Serialize fixed-width limbs without re-validating the field range. Callers that need a
        // canonical encoding must pass a valid element; some protocols intentionally serialize raw
        // residues here and reduce or validate them elsewhere.
        return this.isLE ? numberToBytesLE(num, this.BYTES) : numberToBytesBE$1(num, this.BYTES);
    }
    fromBytes(bytes, skipValidation = false) {
        abytes$1(bytes);
        const { _lengths: allowedLengths, BYTES, isLE, ORDER, _mod: modFromBytes } = this;
        if (allowedLengths) {
            // `allowedLengths` must list real positive byte lengths; otherwise empty input would get
            // padded into zero and silently decode as a field element.
            if (bytes.length < 1 || !allowedLengths.includes(bytes.length) || bytes.length > BYTES) {
                throw new Error('Field.fromBytes: expected ' + allowedLengths + ' bytes, got ' + bytes.length);
            }
            const padded = new Uint8Array(BYTES);
            // isLE add 0 to right, !isLE to the left.
            padded.set(bytes, isLE ? 0 : padded.length - bytes.length);
            bytes = padded;
        }
        if (bytes.length !== BYTES)
            throw new Error('Field.fromBytes: expected ' + BYTES + ' bytes, got ' + bytes.length);
        let scalar = isLE ? bytesToNumberLE(bytes) : bytesToNumberBE$1(bytes);
        if (modFromBytes)
            scalar = mod(scalar, ORDER);
        if (!skipValidation)
            if (!this.isValid(scalar))
                throw new Error('invalid field element: outside of range 0..ORDER');
        // Range validation is optional here because some protocols intentionally decode raw residues
        // and reduce or validate them elsewhere.
        return scalar;
    }
    // TODO: we don't need it here, move out to separate fn
    invertBatch(lst) {
        return FpInvertBatch(this, lst);
    }
    // We can't move this out because Fp6, Fp12 implement it
    // and it's unclear what to return in there.
    cmov(a, b, condition) {
        // Field elements have `isValid(...)`; the CMOV branch bit is a direct runtime input, so reject
        // non-boolean selectors here instead of letting JS truthiness silently change arithmetic.
        abool$1(condition, 'condition');
        return condition ? b : a;
    }
}
// Freeze the shared method surface too; otherwise callers can still poison every Field instance by
// monkey-patching `_Field.prototype` even if each instance is frozen.
Object.freeze(_Field.prototype);
/**
 * Creates a finite field. Major performance optimizations:
 * * 1. Denormalized operations like mulN instead of mul.
 * * 2. Identical object shape: never add or remove keys.
 * * 3. Frozen stable object shape; the lazy sqrt cache lives in a module-level `WeakMap`.
 * Fragile: always run a benchmark on a change.
 * Security note: operations and low-level serializers like `toBytes` don't check `isValid` for
 * all elements for performance and protocol-flexibility reasons; callers are responsible for
 * supplying valid elements when they need canonical field behavior.
 * This is low-level code, please make sure you know what you're doing.
 *
 * Note about field properties:
 * * CHARACTERISTIC p = prime number, number of elements in main subgroup.
 * * ORDER q = similar to cofactor in curves, may be composite `q = p^m`.
 *
 * @param ORDER - field order, probably prime, or could be composite
 * @param opts - Field options such as bit length or endianness. See {@link FieldOpts}.
 * @returns Frozen field instance with a stable object shape. This wrapper forwards `opts` straight
 *   into `_Field`, so it inherits `_Field`'s assumptions about cached sizes and `allowedLengths`.
 * @example
 * Construct one prime field with optional overrides.
 *
 * ```ts
 * Field(11n);
 * ```
 */
function Field(ORDER, opts = {}) {
    return new _Field(ORDER, opts);
}

/**
 * Methods for elliptic curve multiplication by scalars.
 * Contains wNAF, pippenger.
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
const _0n$4 = /* @__PURE__ */ BigInt(0);
const _1n$4 = /* @__PURE__ */ BigInt(1);
/**
 * Computes both candidates first, but the final selection still branches on `condition`, so this
 * is not a strict constant-time CMOV primitive.
 * @param condition - Whether to negate the point.
 * @param item - Point-like value.
 * @returns Original or negated value.
 * @example
 * Keep the point or return its negation based on one boolean branch.
 *
 * ```ts
 * import { negateCt } from '@noble/curves/abstract/curve.js';
 * import { p256 } from '@noble/curves/nist.js';
 * const maybeNegated = negateCt(true, p256.Point.BASE);
 * ```
 */
function negateCt(condition, item) {
    const neg = item.negate();
    return condition ? neg : item;
}
/**
 * Takes a bunch of Projective Points but executes only one
 * inversion on all of them. Inversion is very slow operation,
 * so this improves performance massively.
 * Optimization: converts a list of projective points to a list of identical points with Z=1.
 * Input points are left unchanged; the normalized points are returned as fresh instances.
 * @param c - Point constructor.
 * @param points - Projective points.
 * @returns Fresh projective points reconstructed from normalized affine coordinates.
 * @example
 * Batch-normalize projective points with a single shared inversion.
 *
 * ```ts
 * import { normalizeZ } from '@noble/curves/abstract/curve.js';
 * import { p256 } from '@noble/curves/nist.js';
 * const points = normalizeZ(p256.Point, [p256.Point.BASE, p256.Point.BASE.double()]);
 * ```
 */
function normalizeZ(c, points) {
    const invertedZs = FpInvertBatch(c.Fp, points.map((p) => p.Z));
    return points.map((p, i) => c.fromAffine(p.toAffine(invertedZs[i])));
}
function validateW(W, bits) {
    if (!Number.isSafeInteger(W) || W <= 0 || W > bits)
        throw new Error('invalid window size, expected [1..' + bits + '], got W=' + W);
}
function calcWOpts(W, scalarBits) {
    validateW(W, scalarBits);
    const windows = Math.ceil(scalarBits / W) + 1; // W=8 33. Not 32, because we skip zero
    const windowSize = 2 ** (W - 1); // W=8 128. Not 256, because we skip zero
    const maxNumber = 2 ** W; // W=8 256
    const mask = bitMask(W); // W=8 255 == mask 0b11111111
    const shiftBy = BigInt(W); // W=8 8
    return { windows, windowSize, mask, maxNumber, shiftBy };
}
function calcOffsets(n, window, wOpts) {
    const { windowSize, mask, maxNumber, shiftBy } = wOpts;
    let wbits = Number(n & mask); // extract W bits.
    let nextN = n >> shiftBy; // shift number by W bits.
    // What actually happens here:
    // const highestBit = Number(mask ^ (mask >> 1n));
    // let wbits2 = wbits - 1; // skip zero
    // if (wbits2 & highestBit) { wbits2 ^= Number(mask); // (~);
    // split if bits > max: +224 => 256-32
    if (wbits > windowSize) {
        // we skip zero, which means instead of `>= size-1`, we do `> size`
        wbits -= maxNumber; // -32, can be maxNumber - wbits, but then we need to set isNeg here.
        nextN += _1n$4; // +256 (carry)
    }
    const offsetStart = window * windowSize;
    const offset = offsetStart + Math.abs(wbits) - 1; // -1 because we skip zero; ignore when isZero
    const isZero = wbits === 0; // is current window slice a 0?
    const isNeg = wbits < 0; // is current window slice negative?
    const isNegF = window % 2 !== 0; // fake branch noise only
    const offsetF = offsetStart; // fake branch noise only
    return { nextN, offset, isZero, isNeg, isNegF, offsetF };
}
// Since points in different groups cannot be equal (different object constructor),
// we can have single place to store precomputes.
// Allows to make points frozen / immutable.
const pointPrecomputes = new WeakMap();
const pointWindowSizes = new WeakMap();
function getW(P) {
    // To disable precomputes:
    // return 1;
    // `1` is also the uncached sentinel: use the ladder / non-precomputed path.
    return pointWindowSizes.get(P) || 1;
}
function assert0(n) {
    // Internal invariant: a non-zero remainder here means the wNAF window decomposition or loop
    // count is inconsistent, not that the original caller provided a bad scalar.
    if (n !== _0n$4)
        throw new Error('invalid wNAF');
}
/**
 * Elliptic curve multiplication of Point by scalar. Fragile.
 * Table generation takes **30MB of ram and 10ms on high-end CPU**,
 * but may take much longer on slow devices. Actual generation will happen on
 * first call of `multiply()`. By default, `BASE` point is precomputed.
 *
 * Scalars should always be less than curve order: this should be checked inside of a curve itself.
 * Creates precomputation tables for fast multiplication:
 * - private scalar is split by fixed size windows of W bits
 * - every window point is collected from window's table & added to accumulator
 * - since windows are different, same point inside tables won't be accessed more than once per calc
 * - each multiplication is 'Math.ceil(CURVE_ORDER / 𝑊) + 1' point additions (fixed for any scalar)
 * - +1 window is neccessary for wNAF
 * - wNAF reduces table size: 2x less memory + 2x faster generation, but 10% slower multiplication
 *
 * TODO: research returning a 2d JS array of windows instead of a single window.
 * This would allow windows to be in different memory locations.
 * @param Point - Point constructor.
 * @param bits - Scalar bit length.
 * @example
 * Elliptic curve multiplication of Point by scalar.
 *
 * ```ts
 * import { wNAF } from '@noble/curves/abstract/curve.js';
 * import { p256 } from '@noble/curves/nist.js';
 * const ladder = new wNAF(p256.Point, p256.Point.Fn.BITS);
 * ```
 */
class wNAF {
    BASE;
    ZERO;
    Fn;
    bits;
    // Parametrized with a given Point class (not individual point)
    constructor(Point, bits) {
        this.BASE = Point.BASE;
        this.ZERO = Point.ZERO;
        this.Fn = Point.Fn;
        this.bits = bits;
    }
    // non-const time multiplication ladder
    _unsafeLadder(elm, n, p = this.ZERO) {
        let d = elm;
        while (n > _0n$4) {
            if (n & _1n$4)
                p = p.add(d);
            d = d.double();
            n >>= _1n$4;
        }
        return p;
    }
    /**
     * Creates a wNAF precomputation window. Used for caching.
     * Default window size is set by `utils.precompute()` and is equal to 8.
     * Number of precomputed points depends on the curve size:
     * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
     * - 𝑊 is the window size
     * - 𝑛 is the bitlength of the curve order.
     * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
     * @param point - Point instance
     * @param W - window size
     * @returns precomputed point tables flattened to a single array
     */
    precomputeWindow(point, W) {
        const { windows, windowSize } = calcWOpts(W, this.bits);
        const points = [];
        let p = point;
        let base = p;
        for (let window = 0; window < windows; window++) {
            base = p;
            points.push(base);
            // i=1, bc we skip 0
            for (let i = 1; i < windowSize; i++) {
                base = base.add(p);
                points.push(base);
            }
            p = base.double();
        }
        return points;
    }
    /**
     * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
     * More compact implementation:
     * https://github.com/paulmillr/noble-secp256k1/blob/47cb1669b6e506ad66b35fe7d76132ae97465da2/index.ts#L502-L541
     * @returns real and fake (for const-time) points
     */
    wNAF(W, precomputes, n) {
        // Scalar should be smaller than field order
        if (!this.Fn.isValid(n))
            throw new Error('invalid scalar');
        // Accumulators
        let p = this.ZERO;
        let f = this.BASE;
        // This code was first written with assumption that 'f' and 'p' will never be infinity point:
        // since each addition is multiplied by 2 ** W, it cannot cancel each other. However,
        // there is negate now: it is possible that negated element from low value
        // would be the same as high element, which will create carry into next window.
        // It's not obvious how this can fail, but still worth investigating later.
        const wo = calcWOpts(W, this.bits);
        for (let window = 0; window < wo.windows; window++) {
            // (n === _0n) is handled and not early-exited. isEven and offsetF are used for noise
            const { nextN, offset, isZero, isNeg, isNegF, offsetF } = calcOffsets(n, window, wo);
            n = nextN;
            if (isZero) {
                // bits are 0: add garbage to fake point
                // Important part for const-time getPublicKey: add random "noise" point to f.
                f = f.add(negateCt(isNegF, precomputes[offsetF]));
            }
            else {
                // bits are 1: add to result point
                p = p.add(negateCt(isNeg, precomputes[offset]));
            }
        }
        assert0(n);
        // Return both real and fake points so JIT keeps the noise path alive.
        // Known caveat: negate/carry interactions can still drive `f` to infinity even when `p` is not,
        // which weakens the noise path and leaves this only "less const-time" by about one bigint mul.
        return { p, f };
    }
    /**
     * Implements unsafe EC multiplication using precomputed tables
     * and w-ary non-adjacent form.
     * @param acc - accumulator point to add result of multiplication
     * @returns point
     */
    wNAFUnsafe(W, precomputes, n, acc = this.ZERO) {
        const wo = calcWOpts(W, this.bits);
        for (let window = 0; window < wo.windows; window++) {
            if (n === _0n$4)
                break; // Early-exit, skip 0 value
            const { nextN, offset, isZero, isNeg } = calcOffsets(n, window, wo);
            n = nextN;
            if (isZero) {
                // Window bits are 0: skip processing.
                // Move to next window.
                continue;
            }
            else {
                const item = precomputes[offset];
                acc = acc.add(isNeg ? item.negate() : item); // Re-using acc allows to save adds in MSM
            }
        }
        assert0(n);
        return acc;
    }
    getPrecomputes(W, point, transform) {
        // Cache key is only point identity plus the remembered window size; callers must not reuse the
        // same point with incompatible `transform(...)` layouts and expect a separate cache entry.
        let comp = pointPrecomputes.get(point);
        if (!comp) {
            comp = this.precomputeWindow(point, W);
            if (W !== 1) {
                // Doing transform outside of if brings 15% perf hit
                if (typeof transform === 'function')
                    comp = transform(comp);
                pointPrecomputes.set(point, comp);
            }
        }
        return comp;
    }
    cached(point, scalar, transform) {
        const W = getW(point);
        return this.wNAF(W, this.getPrecomputes(W, point, transform), scalar);
    }
    unsafe(point, scalar, transform, prev) {
        const W = getW(point);
        if (W === 1)
            return this._unsafeLadder(point, scalar, prev); // For W=1 ladder is ~x2 faster
        return this.wNAFUnsafe(W, this.getPrecomputes(W, point, transform), scalar, prev);
    }
    // We calculate precomputes for elliptic curve point multiplication
    // using windowed method. This specifies window size and
    // stores precomputed values. Usually only base point would be precomputed.
    createCache(P, W) {
        validateW(W, this.bits);
        pointWindowSizes.set(P, W);
        pointPrecomputes.delete(P);
    }
    hasCache(elm) {
        return getW(elm) !== 1;
    }
}
function createField(order, field, isLE) {
    if (field) {
        // Reuse supplied field overrides as-is; `isLE` only affects freshly constructed fallback
        // fields, and validateField() below only checks the arithmetic subset, not full byte/cmov
        // behavior.
        if (field.ORDER !== order)
            throw new Error('Field.ORDER must match order: Fp == p, Fn == n');
        validateField(field);
        return field;
    }
    else {
        return Field(order, { isLE });
    }
}
/**
 * Validates basic CURVE shape and field membership, then creates fields.
 * This does not prove that the generator is on-curve, that subgroup/order data are consistent, or
 * that the curve equation itself is otherwise sane.
 * @param type - Curve family.
 * @param CURVE - Curve parameters.
 * @param curveOpts - Optional field overrides:
 *   - `Fp` (optional): Optional base-field override.
 *   - `Fn` (optional): Optional scalar-field override.
 * @param FpFnLE - Whether field encoding is little-endian.
 * @returns Frozen curve parameters and fields.
 * @throws If the curve parameters or field overrides are invalid. {@link Error}
 * @example
 * Build curve fields from raw constants before constructing a curve instance.
 *
 * ```ts
 * const curve = createCurveFields('weierstrass', {
 *   p: 17n,
 *   n: 19n,
 *   h: 1n,
 *   a: 2n,
 *   b: 2n,
 *   Gx: 5n,
 *   Gy: 1n,
 * });
 * ```
 */
function createCurveFields(type, CURVE, curveOpts = {}, FpFnLE) {
    if (FpFnLE === undefined)
        FpFnLE = type === 'edwards';
    if (!CURVE || typeof CURVE !== 'object')
        throw new Error(`expected valid ${type} CURVE object`);
    for (const p of ['p', 'n', 'h']) {
        const val = CURVE[p];
        if (!(typeof val === 'bigint' && val > _0n$4))
            throw new Error(`CURVE.${p} must be positive bigint`);
    }
    const Fp = createField(CURVE.p, curveOpts.Fp, FpFnLE);
    const Fn = createField(CURVE.n, curveOpts.Fn, FpFnLE);
    const _b = 'd';
    const params = ['Gx', 'Gy', 'a', _b];
    for (const p of params) {
        // @ts-ignore
        if (!Fp.isValid(CURVE[p]))
            throw new Error(`CURVE.${p} must be valid field element of CURVE.Fp`);
    }
    CURVE = Object.freeze(Object.assign({}, CURVE));
    return { CURVE, Fp, Fn };
}
/**
 * @param randomSecretKey - Secret-key generator.
 * @param getPublicKey - Public-key derivation helper.
 * @returns Keypair generator.
 * @example
 * Build a `keygen()` helper from existing secret-key and public-key primitives.
 *
 * ```ts
 * import { createKeygen } from '@noble/curves/abstract/curve.js';
 * import { p256 } from '@noble/curves/nist.js';
 * const keygen = createKeygen(p256.utils.randomSecretKey, p256.getPublicKey);
 * const pair = keygen();
 * ```
 */
function createKeygen(randomSecretKey, getPublicKey) {
    return function keygen(seed) {
        const secretKey = randomSecretKey(seed);
        return { secretKey, publicKey: getPublicKey(secretKey) };
    };
}

/**
 * Twisted Edwards curve. The formula is: ax² + y² = 1 + dx²y².
 * For design rationale of types / exports, see weierstrass module documentation.
 * Untwisted Edwards curves exist, but they aren't used in real-world protocols.
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
// Be friendly to bad ECMAScript parsers by not using bigint literals
// prettier-ignore
const _0n$3 = /* @__PURE__ */ BigInt(0), _1n$3 = /* @__PURE__ */ BigInt(1), _2n$3 = /* @__PURE__ */ BigInt(2), _8n$2 = /* @__PURE__ */ BigInt(8);
// Affine Edwards-equation check only; this does not prove subgroup membership, canonical
// encoding, prime-order base-point requirements, or identity exclusion.
function isEdValidXY(Fp, CURVE, x, y) {
    const x2 = Fp.sqr(x);
    const y2 = Fp.sqr(y);
    const left = Fp.add(Fp.mul(CURVE.a, x2), y2);
    const right = Fp.add(Fp.ONE, Fp.mul(CURVE.d, Fp.mul(x2, y2)));
    return Fp.eql(left, right);
}
/**
 * @param params - Curve parameters. See {@link EdwardsOpts}.
 * @param extraOpts - Optional helpers and overrides. See {@link EdwardsExtraOpts}.
 * @returns Edwards point constructor. Generator validation here only checks
 *   that `(Gx, Gy)` satisfies the affine Edwards equation.
 *   RFC 8032 base-point constraints like `B != (0,1)` and `[L]B = 0`
 *   are left to the caller's chosen parameters, since eager subgroup
 *   validation here adds about 10-15ms to heavyweight imports like ed448.
 *   The returned constructor also eagerly marks `Point.BASE` for W=8
 *   precompute caching. Some code paths still assume
 *   `Fp.BYTES === Fn.BYTES`, so mismatched byte lengths are not fully audited here.
 * @throws If the curve parameters or Edwards overrides are invalid. {@link Error}
 * @example
 * ```ts
 * import { edwards } from '@noble/curves/abstract/edwards.js';
 * import { jubjub } from '@noble/curves/misc.js';
 * // Build a point constructor from explicit curve parameters, then use its base point.
 * const Point = edwards(jubjub.Point.CURVE());
 * Point.BASE.toHex();
 * ```
 */
function edwards(params, extraOpts = {}) {
    const opts = extraOpts;
    const validated = createCurveFields('edwards', params, opts, opts.FpFnLE);
    const { Fp, Fn } = validated;
    let CURVE = validated.CURVE;
    const { h: cofactor } = CURVE;
    validateObject(opts, {}, { uvRatio: 'function' });
    // Important:
    // There are some places where Fp.BYTES is used instead of nByteLength.
    // So far, everything has been tested with curves of Fp.BYTES == nByteLength.
    // TODO: test and find curves which behave otherwise.
    const MASK = _2n$3 << (BigInt(Fn.BYTES * 8) - _1n$3);
    const modP = (n) => Fp.create(n); // Function overrides
    // sqrt(u/v)
    const uvRatio = opts.uvRatio === undefined
        ? (u, v) => {
            try {
                return { isValid: true, value: Fp.sqrt(Fp.div(u, v)) };
            }
            catch (e) {
                return { isValid: false, value: _0n$3 };
            }
        }
        : opts.uvRatio;
    // Validate whether the passed curve params are valid.
    // equation ax² + y² = 1 + dx²y² should work for generator point.
    if (!isEdValidXY(Fp, CURVE, CURVE.Gx, CURVE.Gy))
        throw new Error('bad curve params: generator point');
    /**
     * Asserts coordinate is valid: 0 <= n < MASK.
     * Coordinates >= Fp.ORDER are allowed for zip215.
     */
    function acoord(title, n, banZero = false) {
        const min = banZero ? _1n$3 : _0n$3;
        aInRange('coordinate ' + title, n, min, MASK);
        return n;
    }
    function aedpoint(other) {
        if (!(other instanceof Point))
            throw new Error('EdwardsPoint expected');
    }
    // Extended Point works in extended coordinates: (X, Y, Z, T) ∋ (x=X/Z, y=Y/Z, T=xy).
    // https://en.wikipedia.org/wiki/Twisted_Edwards_curve#Extended_coordinates
    class Point {
        // base / generator point
        static BASE = new Point(CURVE.Gx, CURVE.Gy, _1n$3, modP(CURVE.Gx * CURVE.Gy));
        // zero / infinity / identity point
        static ZERO = new Point(_0n$3, _1n$3, _1n$3, _0n$3); // 0, 1, 1, 0
        // math field
        static Fp = Fp;
        // scalar field
        static Fn = Fn;
        X;
        Y;
        Z;
        T;
        constructor(X, Y, Z, T) {
            this.X = acoord('x', X);
            this.Y = acoord('y', Y);
            this.Z = acoord('z', Z, true);
            this.T = acoord('t', T);
            Object.freeze(this);
        }
        static CURVE() {
            return CURVE;
        }
        /**
         * Create one extended Edwards point from affine coordinates.
         * Does NOT validate that the point is on-curve or torsion-free.
         * Use `.assertValidity()` on adversarial inputs.
         */
        static fromAffine(p) {
            if (p instanceof Point)
                throw new Error('extended point not allowed');
            const { x, y } = p || {};
            acoord('x', x);
            acoord('y', y);
            return new Point(x, y, _1n$3, modP(x * y));
        }
        // Uses algo from RFC8032 5.1.3.
        static fromBytes(bytes, zip215 = false) {
            const len = Fp.BYTES;
            const { a, d } = CURVE;
            bytes = copyBytes$2(abytes$1(bytes, len, 'point'));
            abool$1(zip215, 'zip215');
            const normed = copyBytes$2(bytes); // copy again, we'll manipulate it
            const lastByte = bytes[len - 1]; // select last byte
            normed[len - 1] = lastByte & -129; // clear last bit
            const y = bytesToNumberLE(normed);
            // zip215=true is good for consensus-critical apps. =false follows RFC8032 / NIST186-5.
            // RFC8032 prohibits >= p, but ZIP215 doesn't
            // zip215=true:  0 <= y < MASK (2^256 for ed25519)
            // zip215=false: 0 <= y < P (2^255-19 for ed25519)
            const max = zip215 ? MASK : Fp.ORDER;
            aInRange('point.y', y, _0n$3, max);
            // Ed25519: x² = (y²-1)/(dy²+1) mod p. Ed448: x² = (y²-1)/(dy²-1) mod p. Generic case:
            // ax²+y²=1+dx²y² => y²-1=dx²y²-ax² => y²-1=x²(dy²-a) => x²=(y²-1)/(dy²-a)
            const y2 = modP(y * y); // denominator is always non-0 mod p.
            const u = modP(y2 - _1n$3); // u = y² - 1
            const v = modP(d * y2 - a); // v = d y² + 1.
            let { isValid, value: x } = uvRatio(u, v); // √(u/v)
            if (!isValid)
                throw new Error('bad point: invalid y coordinate');
            const isXOdd = (x & _1n$3) === _1n$3; // There are 2 square roots. Use x_0 bit to select proper
            const isLastByteOdd = (lastByte & 0x80) !== 0; // x_0, last bit
            if (!zip215 && x === _0n$3 && isLastByteOdd)
                // if x=0 and x_0 = 1, fail
                throw new Error('bad point: x=0 and x_0=1');
            if (isLastByteOdd !== isXOdd)
                x = modP(-x); // if x_0 != x mod 2, set x = p-x
            return Point.fromAffine({ x, y });
        }
        static fromHex(hex, zip215 = false) {
            return Point.fromBytes(hexToBytes(hex), zip215);
        }
        get x() {
            return this.toAffine().x;
        }
        get y() {
            return this.toAffine().y;
        }
        precompute(windowSize = 8, isLazy = true) {
            wnaf.createCache(this, windowSize);
            if (!isLazy)
                this.multiply(_2n$3); // random number
            return this;
        }
        // Useful in fromAffine() - not for fromBytes(), which always created valid points.
        assertValidity() {
            const p = this;
            const { a, d } = CURVE;
            // Keep generic Edwards validation fail-closed on the neutral point.
            // Even though ZERO is algebraically valid and can roundtrip through encodings, higher-level
            // callers often reach it only through broken hash/scalar plumbing; rejecting it here avoids
            // silently treating that degenerate state as an ordinary public point.
            if (p.is0())
                throw new Error('bad point: ZERO'); // TODO: optimize, with vars below?
            // Equation in affine coordinates: ax² + y² = 1 + dx²y²
            // Equation in projective coordinates (X/Z, Y/Z, Z):  (aX² + Y²)Z² = Z⁴ + dX²Y²
            const { X, Y, Z, T } = p;
            const X2 = modP(X * X); // X²
            const Y2 = modP(Y * Y); // Y²
            const Z2 = modP(Z * Z); // Z²
            const Z4 = modP(Z2 * Z2); // Z⁴
            const aX2 = modP(X2 * a); // aX²
            const left = modP(Z2 * modP(aX2 + Y2)); // (aX² + Y²)Z²
            const right = modP(Z4 + modP(d * modP(X2 * Y2))); // Z⁴ + dX²Y²
            if (left !== right)
                throw new Error('bad point: equation left != right (1)');
            // In Extended coordinates we also have T, which is x*y=T/Z: check X*Y == Z*T
            const XY = modP(X * Y);
            const ZT = modP(Z * T);
            if (XY !== ZT)
                throw new Error('bad point: equation left != right (2)');
        }
        // Compare one point to another.
        equals(other) {
            aedpoint(other);
            const { X: X1, Y: Y1, Z: Z1 } = this;
            const { X: X2, Y: Y2, Z: Z2 } = other;
            const X1Z2 = modP(X1 * Z2);
            const X2Z1 = modP(X2 * Z1);
            const Y1Z2 = modP(Y1 * Z2);
            const Y2Z1 = modP(Y2 * Z1);
            return X1Z2 === X2Z1 && Y1Z2 === Y2Z1;
        }
        is0() {
            return this.equals(Point.ZERO);
        }
        negate() {
            // Flips point sign to a negative one (-x, y in affine coords)
            return new Point(modP(-this.X), this.Y, this.Z, modP(-this.T));
        }
        // Fast algo for doubling Extended Point.
        // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#doubling-dbl-2008-hwcd
        // Cost: 4M + 4S + 1*a + 6add + 1*2.
        double() {
            const { a } = CURVE;
            const { X: X1, Y: Y1, Z: Z1 } = this;
            const A = modP(X1 * X1); // A = X12
            const B = modP(Y1 * Y1); // B = Y12
            const C = modP(_2n$3 * modP(Z1 * Z1)); // C = 2*Z12
            const D = modP(a * A); // D = a*A
            const x1y1 = X1 + Y1;
            const E = modP(modP(x1y1 * x1y1) - A - B); // E = (X1+Y1)2-A-B
            const G = D + B; // G = D+B
            const F = G - C; // F = G-C
            const H = D - B; // H = D-B
            const X3 = modP(E * F); // X3 = E*F
            const Y3 = modP(G * H); // Y3 = G*H
            const T3 = modP(E * H); // T3 = E*H
            const Z3 = modP(F * G); // Z3 = F*G
            return new Point(X3, Y3, Z3, T3);
        }
        // Fast algo for adding 2 Extended Points.
        // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#addition-add-2008-hwcd
        // Cost: 9M + 1*a + 1*d + 7add.
        add(other) {
            aedpoint(other);
            const { a, d } = CURVE;
            const { X: X1, Y: Y1, Z: Z1, T: T1 } = this;
            const { X: X2, Y: Y2, Z: Z2, T: T2 } = other;
            const A = modP(X1 * X2); // A = X1*X2
            const B = modP(Y1 * Y2); // B = Y1*Y2
            const C = modP(T1 * d * T2); // C = T1*d*T2
            const D = modP(Z1 * Z2); // D = Z1*Z2
            const E = modP((X1 + Y1) * (X2 + Y2) - A - B); // E = (X1+Y1)*(X2+Y2)-A-B
            const F = D - C; // F = D-C
            const G = D + C; // G = D+C
            const H = modP(B - a * A); // H = B-a*A
            const X3 = modP(E * F); // X3 = E*F
            const Y3 = modP(G * H); // Y3 = G*H
            const T3 = modP(E * H); // T3 = E*H
            const Z3 = modP(F * G); // Z3 = F*G
            return new Point(X3, Y3, Z3, T3);
        }
        subtract(other) {
            // Validate before calling `negate()` so wrong inputs fail with the point guard
            // instead of leaking a foreign `negate()` error.
            aedpoint(other);
            return this.add(other.negate());
        }
        // Constant-time multiplication.
        multiply(scalar) {
            // 1 <= scalar < L
            // Keep the subgroup-scalar contract strict instead of reducing 0 / n to ZERO.
            // In keygen/signing-style callers, those values usually mean broken hash/scalar plumbing,
            // and failing closed is safer than silently producing the identity point.
            if (!Fn.isValidNot0(scalar))
                throw new RangeError('invalid scalar: expected 1 <= sc < curve.n');
            const { p, f } = wnaf.cached(this, scalar, (p) => normalizeZ(Point, p));
            return normalizeZ(Point, [p, f])[0];
        }
        // Non-constant-time multiplication. Uses double-and-add algorithm.
        // It's faster, but should only be used when you don't care about
        // an exposed private key e.g. sig verification.
        // Keeps the same subgroup-scalar contract: 0 is allowed for public-scalar callers, but
        // n and larger values are rejected instead of being reduced mod n to the identity point.
        multiplyUnsafe(scalar) {
            // 0 <= scalar < L
            if (!Fn.isValid(scalar))
                throw new RangeError('invalid scalar: expected 0 <= sc < curve.n');
            if (scalar === _0n$3)
                return Point.ZERO;
            if (this.is0() || scalar === _1n$3)
                return this;
            return wnaf.unsafe(this, scalar, (p) => normalizeZ(Point, p));
        }
        // Checks if point is of small order.
        // If you add something to small order point, you will have "dirty"
        // point with torsion component.
        // Clears cofactor and checks if the result is 0.
        isSmallOrder() {
            return this.clearCofactor().is0();
        }
        // Multiplies point by curve order and checks if the result is 0.
        // Returns `false` is the point is dirty.
        isTorsionFree() {
            return wnaf.unsafe(this, CURVE.n).is0();
        }
        // Converts Extended point to default (x, y) coordinates.
        // Can accept precomputed Z^-1 - for example, from invertBatch.
        toAffine(invertedZ) {
            const p = this;
            let iz = invertedZ;
            const { X, Y, Z } = p;
            const is0 = p.is0();
            if (iz == null)
                iz = is0 ? _8n$2 : Fp.inv(Z); // 8 was chosen arbitrarily
            const x = modP(X * iz);
            const y = modP(Y * iz);
            const zz = Fp.mul(Z, iz);
            if (is0)
                return { x: _0n$3, y: _1n$3 };
            if (zz !== _1n$3)
                throw new Error('invZ was invalid');
            return { x, y };
        }
        clearCofactor() {
            if (cofactor === _1n$3)
                return this;
            return this.multiplyUnsafe(cofactor);
        }
        toBytes() {
            const { x, y } = this.toAffine();
            // Fp.toBytes() allows non-canonical encoding of y (>= p).
            const bytes = Fp.toBytes(y);
            // Each y has 2 valid points: (x, y), (x,-y).
            // When compressing, it's enough to store y and use the last byte to encode sign of x
            bytes[bytes.length - 1] |= x & _1n$3 ? 0x80 : 0;
            return bytes;
        }
        toHex() {
            return bytesToHex(this.toBytes());
        }
        toString() {
            return `<Point ${this.is0() ? 'ZERO' : this.toHex()}>`;
        }
    }
    const wnaf = new wNAF(Point, Fn.BITS);
    // Keep constructor work cheap: subgroup/generator validation belongs to the caller's curve
    // parameters, and doing the extra checks here adds about 10-15ms to heavy module imports.
    // Callers that construct custom curves are responsible for supplying the correct base point.
    // try {
    //   Point.BASE.assertValidity();
    //   if (!Point.BASE.isTorsionFree()) throw new Error('bad point: not in prime-order subgroup');
    // } catch {
    //   throw new Error('bad curve params: generator point');
    // }
    // Tiny toy curves can have scalar fields narrower than 8 bits. Skip the
    // eager W=8 cache there instead of rejecting an otherwise valid constructor.
    if (Fn.BITS >= 8)
        Point.BASE.precompute(8); // Enable precomputes. Slows down first publicKey computation by 20ms.
    Object.freeze(Point.prototype);
    Object.freeze(Point);
    return Point;
}
/**
 * Base class for prime-order points like Ristretto255 and Decaf448.
 * These points eliminate cofactor issues by representing equivalence classes
 * of Edwards curve points. Multiple Edwards representatives can describe the
 * same abstract wrapper element, so wrapper validity is not the same thing as
 * the hidden representative being torsion-free.
 * @param ep - Backing Edwards point.
 * @example
 * Base class for prime-order points like Ristretto255 and Decaf448.
 *
 * ```ts
 * import { ristretto255 } from '@noble/curves/ed25519.js';
 * const point = ristretto255.Point.BASE.multiply(2n);
 * ```
 */
class PrimeEdwardsPoint {
    static BASE;
    static ZERO;
    static Fp;
    static Fn;
    ep;
    /**
     * Wrap one internal Edwards representative directly.
     * This is not a canonical encoding boundary: alternate Edwards
     * representatives may still describe the same abstract wrapper element.
     */
    constructor(ep) {
        this.ep = ep;
    }
    // Static methods that must be implemented by subclasses
    static fromBytes(_bytes) {
        notImplemented();
    }
    static fromHex(_hex) {
        notImplemented();
    }
    get x() {
        return this.toAffine().x;
    }
    get y() {
        return this.toAffine().y;
    }
    // Common implementations
    clearCofactor() {
        // no-op for the abstract prime-order wrapper group; this is about the
        // wrapper element, not the hidden Edwards representative.
        return this;
    }
    assertValidity() {
        // Keep wrapper validity at the abstract-group boundary. Canonical decode
        // may choose Edwards representatives that differ by small torsion, so
        // checking `this.ep.isTorsionFree()` here would reject valid wrapper points.
        this.ep.assertValidity();
    }
    /**
     * Return affine coordinates of the current internal Edwards representative.
     * This is a convenience helper, not a canonical Ristretto/Decaf encoding.
     * Equal abstract elements may expose different `x` / `y`; use
     * `toBytes()` / `fromBytes()` for canonical roundtrips.
     */
    toAffine(invertedZ) {
        return this.ep.toAffine(invertedZ);
    }
    toHex() {
        return bytesToHex(this.toBytes());
    }
    toString() {
        return this.toHex();
    }
    isTorsionFree() {
        // Abstract Ristretto/Decaf elements are already prime-order even when the
        // hidden Edwards representative is not torsion-free.
        return true;
    }
    isSmallOrder() {
        return false;
    }
    add(other) {
        this.assertSame(other);
        return this.init(this.ep.add(other.ep));
    }
    subtract(other) {
        this.assertSame(other);
        return this.init(this.ep.subtract(other.ep));
    }
    multiply(scalar) {
        return this.init(this.ep.multiply(scalar));
    }
    multiplyUnsafe(scalar) {
        return this.init(this.ep.multiplyUnsafe(scalar));
    }
    double() {
        return this.init(this.ep.double());
    }
    negate() {
        return this.init(this.ep.negate());
    }
    precompute(windowSize, isLazy) {
        this.ep.precompute(windowSize, isLazy);
        // Keep the wrapper identity stable like the backing Edwards API instead of
        // allocating a fresh wrapper around the same cached point.
        return this;
    }
}
/**
 * Initializes EdDSA signatures over given Edwards curve.
 * @param Point - Edwards point constructor.
 * @param cHash - Hash function.
 * @param eddsaOpts - Optional signature helpers. See {@link EdDSAOpts}.
 * @returns EdDSA helper namespace.
 * @throws If the hash function, options, or derived point operations are invalid. {@link Error}
 * @example
 * Initializes EdDSA signatures over given Edwards curve.
 *
 * ```ts
 * import { eddsa } from '@noble/curves/abstract/edwards.js';
 * import { jubjub } from '@noble/curves/misc.js';
 * import { sha512 } from '@noble/hashes/sha2.js';
 * const sigs = eddsa(jubjub.Point, sha512);
 * const { secretKey, publicKey } = sigs.keygen();
 * const msg = new TextEncoder().encode('hello noble');
 * const sig = sigs.sign(msg, secretKey);
 * const isValid = sigs.verify(sig, msg, publicKey);
 * ```
 */
function eddsa(Point, cHash, eddsaOpts = {}) {
    if (typeof cHash !== 'function')
        throw new Error('"hash" function param is required');
    const hash = cHash;
    const opts = eddsaOpts;
    validateObject(opts, {}, {
        adjustScalarBytes: 'function',
        randomBytes: 'function',
        domain: 'function',
        prehash: 'function',
        zip215: 'boolean',
        mapToCurve: 'function',
    });
    const { prehash } = opts;
    const { BASE, Fp, Fn } = Point;
    const outputLen = hash.outputLen;
    const expectedLen = 2 * Fp.BYTES;
    // When hash metadata is available, reject incompatible EdDSA wrappers at construction time
    // instead of deferring the mismatch until the first keygen/sign call.
    if (outputLen !== undefined) {
        asafenumber(outputLen, 'hash.outputLen');
        if (outputLen !== expectedLen)
            throw new Error(`hash.outputLen must be ${expectedLen}, got ${outputLen}`);
    }
    const randomBytes = opts.randomBytes === undefined ? randomBytes$2 : opts.randomBytes;
    const adjustScalarBytes = opts.adjustScalarBytes === undefined
        ? (bytes) => bytes
        : opts.adjustScalarBytes;
    const domain = opts.domain === undefined
        ? (data, ctx, phflag) => {
            abool$1(phflag, 'phflag');
            if (ctx.length || phflag)
                throw new Error('Contexts/pre-hash are not supported');
            return data;
        }
        : opts.domain; // NOOP
    // Parse an EdDSA digest as a little-endian integer and reduce it modulo the scalar field order.
    function modN_LE(hash) {
        return Fn.create(bytesToNumberLE(hash)); // Not Fn.fromBytes: it has length limit
    }
    // Get the hashed private scalar per RFC8032 5.1.5
    function getPrivateScalar(key) {
        const len = lengths.secretKey;
        abytes$1(key, lengths.secretKey, 'secretKey');
        // Hash private key with curve's hash function to produce uniformingly random input
        // Check byte lengths: ensure(64, h(ensure(32, key)))
        const hashed = abytes$1(hash(key), 2 * len, 'hashedSecretKey');
        // Slice before clamping so in-place adjustors don't corrupt the prefix half.
        const head = adjustScalarBytes(hashed.slice(0, len)); // clear first half bits, produce FE
        const prefix = hashed.slice(len, 2 * len); // second half is called key prefix (5.1.6)
        const scalar = modN_LE(head); // The actual private scalar
        return { head, prefix, scalar };
    }
    /** Convenience method that creates public key from scalar. RFC8032 5.1.5
     * Also exposes the derived scalar/prefix tuple and point form reused by sign().
     */
    function getExtendedPublicKey(secretKey) {
        const { head, prefix, scalar } = getPrivateScalar(secretKey);
        const point = BASE.multiply(scalar); // Point on Edwards curve aka public key
        const pointBytes = point.toBytes();
        return { head, prefix, scalar, point, pointBytes };
    }
    /** Calculates EdDSA pub key. RFC8032 5.1.5. */
    function getPublicKey(secretKey) {
        return getExtendedPublicKey(secretKey).pointBytes;
    }
    // Hash domain-separated chunks into a little-endian scalar modulo the group order.
    function hashDomainToScalar(context = Uint8Array.of(), ...msgs) {
        const msg = concatBytes(...msgs);
        return modN_LE(hash(domain(msg, abytes$1(context, undefined, 'context'), !!prehash)));
    }
    /** Signs message with secret key. RFC8032 5.1.6 */
    function sign(msg, secretKey, options = {}) {
        msg = abytes$1(msg, undefined, 'message');
        if (prehash)
            msg = prehash(msg); // for ed25519ph etc.
        const { prefix, scalar, pointBytes } = getExtendedPublicKey(secretKey);
        const r = hashDomainToScalar(options.context, prefix, msg); // r = dom2(F, C) || prefix || PH(M)
        // RFC 8032 5.1.6 allows r mod L = 0, and SUPERCOP ref10 accepts the resulting identity-point
        // signature.
        // We intentionally keep the safe multiply() rejection here so a miswired all-zero hash provider
        // fails loudly instead of silently producing a degenerate signature.
        const R = BASE.multiply(r).toBytes(); // R = rG
        const k = hashDomainToScalar(options.context, R, pointBytes, msg); // R || A || PH(M)
        const s = Fn.create(r + k * scalar); // S = (r + k * s) mod L
        if (!Fn.isValid(s))
            throw new Error('sign failed: invalid s'); // 0 <= s < L
        const rs = concatBytes(R, Fn.toBytes(s));
        return abytes$1(rs, lengths.signature, 'result');
    }
    // Keep the shared helper strict by default: RFC 8032 / NIST-style wrappers should reject
    // non-canonical encodings unless they explicitly opt into ZIP-215's more permissive decode rules.
    const verifyOpts = {
        zip215: opts.zip215,
    };
    /**
     * Verifies EdDSA signature against message and public key. RFC 8032 §§5.1.7 and 5.2.7.
     * A cofactored verification equation is checked.
     */
    function verify(sig, msg, publicKey, options = verifyOpts) {
        // Preserve the wrapper-selected default for `{}` / `{ zip215: undefined }`, not just omitted opts.
        const { context } = options;
        const zip215 = options.zip215 === undefined ? !!verifyOpts.zip215 : options.zip215;
        const len = lengths.signature;
        sig = abytes$1(sig, len, 'signature');
        msg = abytes$1(msg, undefined, 'message');
        publicKey = abytes$1(publicKey, lengths.publicKey, 'publicKey');
        if (zip215 !== undefined)
            abool$1(zip215, 'zip215');
        if (prehash)
            msg = prehash(msg); // for ed25519ph, etc
        const mid = len / 2;
        const r = sig.subarray(0, mid);
        const s = bytesToNumberLE(sig.subarray(mid, len));
        let A, R, SB;
        try {
            // ZIP-215 is more permissive than RFC 8032 / NIST186-5. Use it only for wrappers that
            // explicitly want consensus-style unreduced encoding acceptance.
            // zip215=true:  0 <= y < MASK (2^256 for ed25519)
            // zip215=false: 0 <= y < P (2^255-19 for ed25519)
            A = Point.fromBytes(publicKey, zip215);
            R = Point.fromBytes(r, zip215);
            SB = BASE.multiplyUnsafe(s); // 0 <= s < l is done inside
        }
        catch (error) {
            return false;
        }
        // RFC 8032 §§5.1.7/5.2.7 and FIPS 186-5 §§7.7.2/7.8.2 only decode A' and check the cofactored
        // verification equation; they do not add a separate low-order-public-key rejection here.
        // Strict mode still rejects small-order A' intentionally for SBS-style non-repudiation and to
        // avoid ambiguous verification outcomes where unusual low-order keys can make distinct
        // key/signature/message combinations verify.
        if (!zip215 && A.isSmallOrder())
            return false;
        // ZIP-215 accepts noncanonical / unreduced point encodings, so the challenge hash must use the
        // exact signature/public-key bytes rather than canonicalized re-encodings of the decoded points.
        const k = hashDomainToScalar(context, r, publicKey, msg);
        const RkA = R.add(A.multiplyUnsafe(k));
        // Check the cofactored verification equation via the curve cofactor h.
        // [h][S]B = [h]R + [h][k]A'
        return RkA.subtract(SB).clearCofactor().is0();
    }
    const _size = Fp.BYTES; // 32 for ed25519, 57 for ed448
    const lengths = {
        secretKey: _size,
        publicKey: _size,
        signature: 2 * _size,
        seed: _size,
    };
    function randomSecretKey(seed) {
        seed = seed === undefined ? randomBytes(lengths.seed) : seed;
        return abytes$1(seed, lengths.seed, 'seed');
    }
    function isValidSecretKey(key) {
        return isBytes$1(key) && key.length === lengths.secretKey;
    }
    function isValidPublicKey(key, zip215) {
        try {
            // Preserve the wrapper-selected default for omitted / `undefined` ZIP-215 flags here too.
            return !!Point.fromBytes(key, zip215 === undefined ? verifyOpts.zip215 : zip215);
        }
        catch (error) {
            return false;
        }
    }
    const utils = {
        getExtendedPublicKey,
        randomSecretKey,
        isValidSecretKey,
        isValidPublicKey,
        /**
         * Converts ed public key to x public key. Uses formula:
         * - ed25519:
         *   - `(u, v) = ((1+y)/(1-y), sqrt(-486664)*u/x)`
         *   - `(x, y) = (sqrt(-486664)*u/v, (u-1)/(u+1))`
         * - ed448:
         *   - `(u, v) = ((y-1)/(y+1), sqrt(156324)*u/x)`
         *   - `(x, y) = (sqrt(156324)*u/v, (1+u)/(1-u))`
         */
        toMontgomery(publicKey) {
            const { y } = Point.fromBytes(publicKey);
            const size = lengths.publicKey;
            const is25519 = size === 32;
            if (!is25519 && size !== 57)
                throw new Error('only defined for 25519 and 448');
            const u = is25519 ? Fp.div(_1n$3 + y, _1n$3 - y) : Fp.div(y - _1n$3, y + _1n$3);
            return Fp.toBytes(u);
        },
        toMontgomerySecret(secretKey) {
            const size = lengths.secretKey;
            abytes$1(secretKey, size);
            const hashed = hash(secretKey.subarray(0, size));
            return adjustScalarBytes(hashed).subarray(0, size);
        },
    };
    Object.freeze(lengths);
    Object.freeze(utils);
    return Object.freeze({
        keygen: createKeygen(randomSecretKey, getPublicKey),
        getPublicKey,
        sign,
        verify,
        utils,
        Point,
        lengths,
    });
}

function checkU32(n) {
    // 0xff_ff_ff_ff
    if (!Number.isSafeInteger(n) || n < 0 || n > 0xffffffff)
        throw new Error('wrong u32 integer:' + n);
    return n;
}
/**
 * Checks if integer is in form of `1 << X`.
 * @param x - Integer to inspect.
 * @returns `true` when the value is a power of two.
 * @throws If `x` is not a valid unsigned 32-bit integer. {@link Error}
 * @example
 * Validate that an FFT size is a power of two.
 *
 * ```ts
 * isPowerOfTwo(8);
 * ```
 */
function isPowerOfTwo(x) {
    checkU32(x);
    return (x & (x - 1)) === 0 && x !== 0;
}
/**
 * @param n - Value to reverse.
 * @param bits - Number of bits to use.
 * @returns Bit-reversed integer.
 * @throws If `n` is not a valid unsigned 32-bit integer. {@link Error}
 * @example
 * Reverse the low `bits` bits of one index.
 *
 * ```ts
 * reverseBits(3, 3);
 * ```
 */
function reverseBits(n, bits) {
    checkU32(n);
    if (!Number.isSafeInteger(bits) || bits < 0 || bits > 32)
        throw new Error(`expected integer 0 <= bits <= 32, got ${bits}`);
    let reversed = 0;
    for (let i = 0; i < bits; i++, n >>>= 1)
        reversed = (reversed << 1) | (n & 1);
    // JS bitwise ops are signed i32; cast back so 32-bit reversals stay in the unsigned u32 domain.
    return reversed >>> 0;
}
/**
 * Similar to `bitLen(x)-1` but much faster for small integers, like indices.
 * @param n - Input value.
 * @returns Base-2 logarithm. For `n = 0`, the current implementation returns `-1`.
 * @throws If `n` is not a valid unsigned 32-bit integer. {@link Error}
 * @example
 * Compute the radix-2 stage count for one transform size.
 *
 * ```ts
 * log2(8);
 * ```
 */
function log2(n) {
    checkU32(n);
    return 31 - Math.clz32(n);
}
/**
 * Moves lowest bit to highest position, which at first step splits
 * array on even and odd indices, then it applied again to each part,
 * which is core of fft
 * @param values - Mutable coefficient array.
 * @returns Mutated input array.
 * @throws If the array length is not a positive power of two. {@link Error}
 * @example
 * Reorder coefficients into bit-reversed order in place.
 *
 * ```ts
 * const values = Uint8Array.from([0, 1, 2, 3]);
 * bitReversalInplace(values);
 * ```
 */
function bitReversalInplace(values) {
    const n = values.length;
    // Size-1 FFT is the identity, so bit-reversal must stay a no-op there instead of rejecting it.
    if (!isPowerOfTwo(n))
        throw new Error('expected positive power-of-two length, got ' + n);
    const bits = log2(n);
    for (let i = 0; i < n; i++) {
        const j = reverseBits(i, bits);
        if (i < j) {
            const tmp = values[i];
            values[i] = values[j];
            values[j] = tmp;
        }
    }
    return values;
}
/**
 * Constructs different flavors of FFT. radix2 implementation of low level mutating API. Flavors:
 *
 * - DIT (Decimation-in-Time): Bottom-Up (leaves to root), Cool-Turkey
 * - DIF (Decimation-in-Frequency): Top-Down (root to leaves), Gentleman-Sande
 *
 * DIT takes brp input, returns natural output.
 * DIF takes natural input, returns brp output.
 *
 * The output is actually identical. Time / frequence distinction is not meaningful
 * for Polynomial multiplication in fields.
 * Which means if protocol supports/needs brp output/inputs, then we can skip this step.
 *
 * Cyclic NTT: Rq = Zq[x]/(x^n-1). butterfly_DIT+loop_DIT OR butterfly_DIF+loop_DIT, roots are omega
 * Negacyclic NTT: Rq = Zq[x]/(x^n+1). butterfly_DIT+loop_DIF, at least for mlkem / mldsa
 * @param F - Field operations.
 * @param coreOpts - FFT configuration:
 *   - `N`: Transform size. Must be a power of two.
 *   - `roots`: Stage roots for the selected transform size.
 *   - `dit`: Whether to run the DIT variant instead of DIF.
 *   - `invertButterflies` (optional): Whether to invert butterfly placement.
 *   - `skipStages` (optional): Number of initial stages to skip.
 *   - `brp` (optional): Whether to apply bit-reversal permutation at the boundary.
 * @returns Low-level FFT loop.
 * @throws If the FFT options or cached roots are invalid for the requested size. {@link Error}
 * @example
 * Constructs different flavors of FFT.
 *
 * ```ts
 * import { FFTCore, rootsOfUnity } from '@noble/curves/abstract/fft.js';
 * import { Field } from '@noble/curves/abstract/modular.js';
 * const Fp = Field(17n);
 * const roots = rootsOfUnity(Fp).roots(2);
 * const loop = FFTCore(Fp, { N: 4, roots, dit: true });
 * const values = loop([1n, 2n, 3n, 4n]);
 * ```
 */
const FFTCore = (F, coreOpts) => {
    const { N, roots, dit, invertButterflies = false, skipStages = 0, brp = true } = coreOpts;
    const bits = log2(N);
    if (!isPowerOfTwo(N))
        throw new Error('FFT: Polynomial size should be power of two');
    // Wrong-sized root tables can stay in-bounds for some loop shapes and silently compute nonsense.
    if (roots.length !== N)
        throw new Error(`FFT: wrong roots length: expected ${N}, got ${roots.length}`);
    const isDit = dit !== invertButterflies;
    return (values) => {
        if (values.length !== N)
            throw new Error('FFT: wrong Polynomial length');
        if (dit && brp)
            bitReversalInplace(values);
        for (let i = 0, g = 1; i < bits - skipStages; i++) {
            // For each stage s (sub-FFT length m = 2^s)
            const s = dit ? i + 1 + skipStages : bits - i;
            const m = 1 << s;
            const m2 = m >> 1;
            const stride = N >> s;
            // Loop over each subarray of length m
            for (let k = 0; k < N; k += m) {
                // Loop over each butterfly within the subarray
                for (let j = 0, grp = g++; j < m2; j++) {
                    const rootPos = invertButterflies ? (dit ? N - grp : grp) : j * stride;
                    const i0 = k + j;
                    const i1 = k + j + m2;
                    const omega = roots[rootPos];
                    const b = values[i1];
                    const a = values[i0];
                    // Inlining gives us 10% perf in kyber vs functions
                    if (isDit) {
                        const t = F.mul(b, omega); // Standard DIT butterfly
                        values[i0] = F.add(a, t);
                        values[i1] = F.sub(a, t);
                    }
                    else if (invertButterflies) {
                        values[i0] = F.add(b, a); // DIT loop + inverted butterflies (Kyber decode)
                        values[i1] = F.mul(F.sub(b, a), omega);
                    }
                    else {
                        values[i0] = F.add(a, b); // Standard DIF butterfly
                        values[i1] = F.mul(F.sub(a, b), omega);
                    }
                }
            }
        }
        if (!dit && brp)
            bitReversalInplace(values);
        return values;
    };
};

/**
 * Montgomery curve methods. It's not really whole montgomery curve,
 * just bunch of very specific methods for X25519 / X448 from
 * [RFC 7748](https://www.rfc-editor.org/rfc/rfc7748)
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
const _0n$2 = BigInt(0);
const _1n$2 = BigInt(1);
const _2n$2 = BigInt(2);
function validateOpts$1(curve) {
    // Validate constructor config eagerly, but do not call user-provided hooks here:
    // `randomBytes` may be transcript-backed or otherwise contextual. Runtime type checks are
    // enough to fail fast on malformed configs without consuming user state.
    validateObject(curve, {
        P: 'bigint',
        type: 'string',
        adjustScalarBytes: 'function',
        powPminus2: 'function',
    }, {
        randomBytes: 'function',
    });
    return Object.freeze({ ...curve });
}
/**
 * @param curveDef - Montgomery curve definition.
 * @returns ECDH helper namespace.
 * @throws If the curve definition or derived shared point is invalid. {@link Error}
 * @example
 * Perform one X25519 key exchange through the generic Montgomery helper.
 *
 * ```ts
 * import { x25519 } from '@noble/curves/ed25519.js';
 * const alice = x25519.keygen();
 * const shared = x25519.getSharedSecret(alice.secretKey, alice.publicKey);
 * ```
 */
function montgomery(curveDef) {
    const CURVE = validateOpts$1(curveDef);
    const { P, type, adjustScalarBytes, powPminus2, randomBytes: rand } = CURVE;
    const is25519 = type === 'x25519';
    if (!is25519 && type !== 'x448')
        throw new Error('invalid type');
    const randomBytes_ = rand === undefined ? randomBytes$2 : rand;
    const montgomeryBits = is25519 ? 255 : 448;
    const fieldLen = is25519 ? 32 : 56;
    const Gu = is25519 ? BigInt(9) : BigInt(5);
    // RFC 7748 #5:
    // The constant a24 is (486662 - 2) / 4 = 121665 for curve25519/X25519 and
    // (156326 - 2) / 4 = 39081 for curve448/X448
    // const a = is25519 ? 486662n : 156326n;
    const a24 = is25519 ? BigInt(121665) : BigInt(39081);
    // RFC: x25519 "the resulting integer is of the form 2^254 plus
    // eight times a value between 0 and 2^251 - 1 (inclusive)"
    // x448: "2^447 plus four times a value between 0 and 2^445 - 1 (inclusive)"
    const minScalar = is25519 ? _2n$2 ** BigInt(254) : _2n$2 ** BigInt(447);
    const maxAdded = is25519
        ? BigInt(8) * _2n$2 ** BigInt(251) - _1n$2
        : BigInt(4) * _2n$2 ** BigInt(445) - _1n$2;
    const maxScalar = minScalar + maxAdded + _1n$2; // (inclusive)
    const modP = (n) => mod(n, P);
    const GuBytes = encodeU(Gu);
    function encodeU(u) {
        return numberToBytesLE(modP(u), fieldLen);
    }
    function decodeU(u) {
        const _u = copyBytes$2(abytes$1(u, fieldLen, 'uCoordinate'));
        // RFC: When receiving such an array, implementations of X25519
        // (but not X448) MUST mask the most significant bit in the final byte.
        if (is25519)
            _u[31] &= 127; // 0b0111_1111
        // RFC: Implementations MUST accept non-canonical values and process them as
        // if they had been reduced modulo the field prime.  The non-canonical
        // values are 2^255 - 19 through 2^255 - 1 for X25519 and 2^448 - 2^224
        // - 1 through 2^448 - 1 for X448.
        return modP(bytesToNumberLE(_u));
    }
    function decodeScalar(scalar) {
        return bytesToNumberLE(adjustScalarBytes(copyBytes$2(abytes$1(scalar, fieldLen, 'scalar'))));
    }
    function scalarMult(scalar, u) {
        const pu = montgomeryLadder(decodeU(u), decodeScalar(scalar));
        // Some public keys are useless, of low-order. Curve author doesn't think
        // it needs to be validated, but we do it nonetheless.
        // https://cr.yp.to/ecdh.html#validate
        if (pu === _0n$2)
            throw new Error('invalid private or public key received');
        return encodeU(pu);
    }
    // Computes public key from private. By doing scalar multiplication of base point.
    function scalarMultBase(scalar) {
        return scalarMult(scalar, GuBytes);
    }
    const getPublicKey = scalarMultBase;
    const getSharedSecret = scalarMult;
    // cswap from RFC7748 "example code"
    function cswap(swap, x_2, x_3) {
        // dummy = mask(swap) AND (x_2 XOR x_3)
        // Where mask(swap) is the all-1 or all-0 word of the same length as x_2
        // and x_3, computed, e.g., as mask(swap) = 0 - swap.
        const dummy = modP(swap * (x_2 - x_3));
        x_2 = modP(x_2 - dummy); // x_2 = x_2 XOR dummy
        x_3 = modP(x_3 + dummy); // x_3 = x_3 XOR dummy
        return { x_2, x_3 };
    }
    /**
     * Montgomery x-only multiplication ladder for the selected X25519/X448 curve.
     * @param pointU - decoded Montgomery u coordinate for the selected curve
     * @param scalar - decoded clamped scalar by which the point is multiplied
     * @returns resulting Montgomery u coordinate for the selected curve
     */
    function montgomeryLadder(u, scalar) {
        aInRange('u', u, _0n$2, P);
        aInRange('scalar', scalar, minScalar, maxScalar);
        const k = scalar;
        const x_1 = u;
        let x_2 = _1n$2;
        let z_2 = _0n$2;
        let x_3 = u;
        let z_3 = _1n$2;
        let swap = _0n$2;
        for (let t = BigInt(montgomeryBits - 1); t >= _0n$2; t--) {
            const k_t = (k >> t) & _1n$2;
            swap ^= k_t;
            ({ x_2, x_3 } = cswap(swap, x_2, x_3));
            ({ x_2: z_2, x_3: z_3 } = cswap(swap, z_2, z_3));
            swap = k_t;
            const A = x_2 + z_2;
            const AA = modP(A * A);
            const B = x_2 - z_2;
            const BB = modP(B * B);
            const E = AA - BB;
            const C = x_3 + z_3;
            const D = x_3 - z_3;
            const DA = modP(D * A);
            const CB = modP(C * B);
            const dacb = DA + CB;
            const da_cb = DA - CB;
            x_3 = modP(dacb * dacb);
            z_3 = modP(x_1 * modP(da_cb * da_cb));
            x_2 = modP(AA * BB);
            z_2 = modP(E * (AA + modP(a24 * E)));
        }
        ({ x_2, x_3 } = cswap(swap, x_2, x_3));
        ({ x_2: z_2, x_3: z_3 } = cswap(swap, z_2, z_3));
        const z2 = powPminus2(z_2); // `Fp.pow(x, P - _2n)` is much slower equivalent
        return modP(x_2 * z2); // Return x_2 * (z_2^(p - 2))
    }
    const lengths = {
        secretKey: fieldLen,
        publicKey: fieldLen,
        seed: fieldLen,
    };
    const randomSecretKey = (seed) => {
        seed = seed === undefined ? randomBytes_(fieldLen) : seed;
        abytes$1(seed, lengths.seed, 'seed');
        // Reuse caller-supplied seed bytes verbatim; clamping is deferred until
        // decodeScalar(...) when the secret key is actually used.
        return seed;
    };
    const utils = { randomSecretKey };
    Object.freeze(lengths);
    Object.freeze(utils);
    return Object.freeze({
        keygen: createKeygen(randomSecretKey, getPublicKey),
        getSharedSecret,
        getPublicKey,
        scalarMult,
        scalarMultBase,
        utils,
        GuBytes: GuBytes.slice(),
        lengths,
    });
}

/**
 * ed25519 Twisted Edwards curve with following addons:
 * - X25519 ECDH
 * - Ristretto cofactor elimination
 * - Elligator hash-to-group / point indistinguishability
 * @module
 */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
// prettier-ignore
const _0n$1 = /* @__PURE__ */ BigInt(0), _1n$1 = /* @__PURE__ */ BigInt(1), _2n$1 = /* @__PURE__ */ BigInt(2), _3n = /* @__PURE__ */ BigInt(3);
// prettier-ignore
const _5n = /* @__PURE__ */ BigInt(5), _8n$1 = /* @__PURE__ */ BigInt(8);
// P = 2n**255n - 19n
const ed25519_CURVE_p = /* @__PURE__ */ BigInt('0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffed');
// N = 2n**252n + 27742317777372353535851937790883648493n
// a = Fp.create(BigInt(-1))
// d = -121665/121666 a.k.a. Fp.neg(121665 * Fp.inv(121666))
const ed25519_CURVE = /* @__PURE__ */ (() => ({
    p: ed25519_CURVE_p,
    n: BigInt('0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed'),
    h: _8n$1,
    a: BigInt('0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffec'),
    d: BigInt('0x52036cee2b6ffe738cc740797779e89800700a4d4141d8ab75eb4dca135978a3'),
    Gx: BigInt('0x216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51a'),
    Gy: BigInt('0x6666666666666666666666666666666666666666666666666666666666666658'),
}))();
function ed25519_pow_2_252_3(x) {
    // prettier-ignore
    const _10n = BigInt(10), _20n = BigInt(20), _40n = BigInt(40), _80n = BigInt(80);
    const P = ed25519_CURVE_p;
    const x2 = (x * x) % P;
    const b2 = (x2 * x) % P; // x^3, 11
    const b4 = (pow2(b2, _2n$1, P) * b2) % P; // x^15, 1111
    const b5 = (pow2(b4, _1n$1, P) * x) % P; // x^31
    const b10 = (pow2(b5, _5n, P) * b5) % P;
    const b20 = (pow2(b10, _10n, P) * b10) % P;
    const b40 = (pow2(b20, _20n, P) * b20) % P;
    const b80 = (pow2(b40, _40n, P) * b40) % P;
    const b160 = (pow2(b80, _80n, P) * b80) % P;
    const b240 = (pow2(b160, _80n, P) * b80) % P;
    const b250 = (pow2(b240, _10n, P) * b10) % P;
    const pow_p_5_8 = (pow2(b250, _2n$1, P) * x) % P;
    // ^ This is x^((p-5)/8); multiply by x once more to get x^((p+3)/8).
    return { pow_p_5_8, b2 };
}
// Mutates and returns the provided 32-byte buffer in place.
function adjustScalarBytes(bytes) {
    // Section 5: For X25519, in order to decode 32 random bytes as an integer scalar,
    // set the three least significant bits of the first byte
    bytes[0] &= 248; // 0b1111_1000
    // and the most significant bit of the last to zero,
    bytes[31] &= 127; // 0b0111_1111
    // set the second most significant bit of the last byte to 1
    bytes[31] |= 64; // 0b0100_0000
    return bytes;
}
// √(-1) aka √(a) aka 2^((p-1)/4)
// Fp.sqrt(Fp.neg(1))
const ED25519_SQRT_M1 = /* @__PURE__ */ BigInt('19681161376707505956807079304988542015446066515923890162744021073123829784752');
// sqrt(u/v). Returns `{ isValid, value }`; on non-squares `value` is still a
// dummy root-shaped field element so callers can stay constant-time.
function uvRatio(u, v) {
    const P = ed25519_CURVE_p;
    const v3 = mod(v * v * v, P); // v³
    const v7 = mod(v3 * v3 * v, P); // v⁷
    // (p+3)/8 and (p-5)/8
    const pow = ed25519_pow_2_252_3(u * v7).pow_p_5_8;
    let x = mod(u * v3 * pow, P); // (uv³)(uv⁷)^(p-5)/8
    const vx2 = mod(v * x * x, P); // vx²
    const root1 = x; // First root candidate
    const root2 = mod(x * ED25519_SQRT_M1, P); // Second root candidate
    const useRoot1 = vx2 === u; // If vx² = u (mod p), x is a square root
    const useRoot2 = vx2 === mod(-u, P); // If vx² = -u, set x <-- x * 2^((p-1)/4)
    const noRoot = vx2 === mod(-u * ED25519_SQRT_M1, P); // There is no valid root, vx² = -u√(-1)
    if (useRoot1)
        x = root1;
    if (useRoot2 || noRoot)
        x = root2; // We return root2 anyway, for const-time
    if (isNegativeLE(x, P))
        x = mod(-x, P);
    return { isValid: useRoot1 || useRoot2, value: x };
}
const ed25519_Point = /* @__PURE__ */ edwards(ed25519_CURVE, { uvRatio });
// Public field alias stays stricter than the RFC 8032 Appendix A sample code:
// `Fp.inv(0)` throws instead of returning `0`.
const Fp = /* @__PURE__ */ (() => ed25519_Point.Fp)();
const Fn = /* @__PURE__ */ (() => ed25519_Point.Fn)();
function ed(opts) {
    // Ed25519 keeps ZIP-215 default verification semantics for consensus compatibility.
    return eddsa(ed25519_Point, sha512, Object.assign({ adjustScalarBytes, zip215: true }, opts));
}
/**
 * ed25519 curve with EdDSA signatures.
 * Seeded `keygen(seed)` / `utils.randomSecretKey(seed)` reuse the provided
 * 32-byte seed buffer instead of copying it.
 * @example
 * Generate one Ed25519 keypair, sign a message, and verify it.
 *
 * ```js
 * import { ed25519 } from '@noble/curves/ed25519.js';
 * const { secretKey, publicKey } = ed25519.keygen();
 * // const publicKey = ed25519.getPublicKey(secretKey);
 * const msg = new TextEncoder().encode('hello noble');
 * const sig = ed25519.sign(msg, secretKey);
 * const isValid = ed25519.verify(sig, msg, publicKey); // ZIP215
 * // RFC8032 / FIPS 186-5
 * const isValid2 = ed25519.verify(sig, msg, publicKey, { zip215: false });
 * ```
 */
const ed25519 = /* @__PURE__ */ ed({});
/**
 * ECDH using curve25519 aka x25519.
 * `getSharedSecret()` rejects low-order peer inputs by default, and seeded
 * `keygen(seed)` reuses the provided 32-byte seed buffer instead of copying it.
 * @example
 * Derive one shared secret between two X25519 peers.
 *
 * ```js
 * import { x25519 } from '@noble/curves/ed25519.js';
 * const alice = x25519.keygen();
 * const bob = x25519.keygen();
 * const shared = x25519.getSharedSecret(alice.secretKey, bob.publicKey);
 * ```
 */
const x25519 = /* @__PURE__ */ (() => {
    const P = ed25519_CURVE_p;
    return montgomery({
        P,
        type: 'x25519',
        powPminus2: (x) => {
            // x^(p-2) aka x^(2^255-21)
            const { pow_p_5_8, b2 } = ed25519_pow_2_252_3(x);
            return mod(pow2(pow_p_5_8, _3n, P) * b2, P);
        },
        adjustScalarBytes,
    });
})();
// √(-1) aka √(a) aka 2^((p-1)/4)
const SQRT_M1 = ED25519_SQRT_M1;
// 1 / √(a-d)
const INVSQRT_A_MINUS_D = /* @__PURE__ */ BigInt('54469307008909316920995813868745141605393597292927456921205312896311721017578');
// `SQRT_RATIO_M1(1, number)` specialization. Returns `{ isValid, value }`,
// where non-squares get the nonnegative `sqrt(SQRT_M1 / number)` branch.
const invertSqrt = (number) => uvRatio(_1n$1, number);
const MAX_255B = /* @__PURE__ */ BigInt('0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
// RFC 9496 §4.3.4 MAP parser: masks bit 255 and reduces modulo p for element
// derivation. The decode path has the opposite contract and rejects that bit.
const bytes255ToNumberLE = (bytes) => Fp.create(bytesToNumberLE(bytes) & MAX_255B);
/**
 * Wrapper over Edwards Point for ristretto255.
 *
 * Each ed25519/EdwardsPoint has 8 different equivalent points. This can be
 * a source of bugs for protocols like ring signatures. Ristretto was created to solve this.
 * Ristretto point operates in X:Y:Z:T extended coordinates like EdwardsPoint,
 * but it should work in its own namespace: do not combine those two.
 * See [RFC9496](https://www.rfc-editor.org/rfc/rfc9496).
 */
class _RistrettoPoint extends PrimeEdwardsPoint {
    // Do NOT change syntax: the following gymnastics is done,
    // because typescript strips comments, which makes bundlers disable tree-shaking.
    // prettier-ignore
    static BASE = 
    /* @__PURE__ */ (() => new _RistrettoPoint(ed25519_Point.BASE))();
    // prettier-ignore
    static ZERO = 
    /* @__PURE__ */ (() => new _RistrettoPoint(ed25519_Point.ZERO))();
    // prettier-ignore
    static Fp = 
    /* @__PURE__ */ (() => Fp)();
    // prettier-ignore
    static Fn = 
    /* @__PURE__ */ (() => Fn)();
    constructor(ep) {
        super(ep);
    }
    /**
     * Create one Ristretto255 point from affine Edwards coordinates.
     * This wraps the internal Edwards representative directly and is not a
     * canonical ristretto255 decoding path.
     * Use `toBytes()` / `fromBytes()` if canonical ristretto255 bytes matter.
     */
    static fromAffine(ap) {
        return new _RistrettoPoint(ed25519_Point.fromAffine(ap));
    }
    assertSame(other) {
        if (!(other instanceof _RistrettoPoint))
            throw new Error('RistrettoPoint expected');
    }
    init(ep) {
        return new _RistrettoPoint(ep);
    }
    static fromBytes(bytes) {
        abytes$2(bytes, 32);
        const { a, d } = ed25519_CURVE;
        const P = ed25519_CURVE_p;
        const mod = (n) => Fp.create(n);
        const s = bytes255ToNumberLE(bytes);
        // 1. Check that s_bytes is the canonical encoding of a field element, or else abort.
        // 3. Check that s is non-negative, or else abort
        if (!equalBytes$2(Fp.toBytes(s), bytes) || isNegativeLE(s, P))
            throw new Error('invalid ristretto255 encoding 1');
        const s2 = mod(s * s);
        const u1 = mod(_1n$1 + a * s2); // 4 (a is -1)
        const u2 = mod(_1n$1 - a * s2); // 5
        const u1_2 = mod(u1 * u1);
        const u2_2 = mod(u2 * u2);
        const v = mod(a * d * u1_2 - u2_2); // 6
        const { isValid, value: I } = invertSqrt(mod(v * u2_2)); // 7
        const Dx = mod(I * u2); // 8
        const Dy = mod(I * Dx * v); // 9
        let x = mod((s + s) * Dx); // 10
        if (isNegativeLE(x, P))
            x = mod(-x); // 10
        const y = mod(u1 * Dy); // 11
        const t = mod(x * y); // 12
        if (!isValid || isNegativeLE(t, P) || y === _0n$1)
            throw new Error('invalid ristretto255 encoding 2');
        return new _RistrettoPoint(new ed25519_Point(x, y, _1n$1, t));
    }
    /**
     * Converts ristretto-encoded string to ristretto point.
     * Described in [RFC9496](https://www.rfc-editor.org/rfc/rfc9496#name-decode).
     * @param hex - Ristretto-encoded 32 bytes. Not every 32-byte string is valid ristretto encoding
     */
    static fromHex(hex) {
        return _RistrettoPoint.fromBytes(hexToBytes$1(hex));
    }
    /**
     * Encodes ristretto point to Uint8Array.
     * Described in [RFC9496](https://www.rfc-editor.org/rfc/rfc9496#name-encode).
     */
    toBytes() {
        let { X, Y, Z, T } = this.ep;
        const P = ed25519_CURVE_p;
        const mod = (n) => Fp.create(n);
        const u1 = mod(mod(Z + Y) * mod(Z - Y)); // 1
        const u2 = mod(X * Y); // 2
        // Square root always exists
        const u2sq = mod(u2 * u2);
        const { value: invsqrt } = invertSqrt(mod(u1 * u2sq)); // 3
        const D1 = mod(invsqrt * u1); // 4
        const D2 = mod(invsqrt * u2); // 5
        const zInv = mod(D1 * D2 * T); // 6
        let D; // 7
        if (isNegativeLE(T * zInv, P)) {
            let _x = mod(Y * SQRT_M1);
            let _y = mod(X * SQRT_M1);
            X = _x;
            Y = _y;
            D = mod(D1 * INVSQRT_A_MINUS_D);
        }
        else {
            D = D2; // 8
        }
        if (isNegativeLE(X * zInv, P))
            Y = mod(-Y); // 9
        let s = mod((Z - Y) * D); // 10 (check footer's note, no sqrt(-a))
        if (isNegativeLE(s, P))
            s = mod(-s);
        return Fp.toBytes(s); // 11
    }
    /**
     * Compares two Ristretto points.
     * Described in [RFC9496](https://www.rfc-editor.org/rfc/rfc9496#name-equals).
     */
    equals(other) {
        this.assertSame(other);
        const { X: X1, Y: Y1 } = this.ep;
        const { X: X2, Y: Y2 } = other.ep;
        const mod = (n) => Fp.create(n);
        // (x1 * y2 == y1 * x2) | (y1 * y2 == x1 * x2)
        const one = mod(X1 * Y2) === mod(Y1 * X2);
        const two = mod(Y1 * Y2) === mod(X1 * X2);
        return one || two;
    }
    is0() {
        return this.equals(_RistrettoPoint.ZERO);
    }
}
Object.freeze(_RistrettoPoint.BASE);
Object.freeze(_RistrettoPoint.ZERO);
Object.freeze(_RistrettoPoint.prototype);
Object.freeze(_RistrettoPoint);

/**
 * SHA3 (keccak) hash function, based on a new "Sponge function" design.
 * Different from older hashes, the internal state is bigger than output size.
 *
 * Check out
 * {@link https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf | FIPS-202},
 * {@link https://keccak.team/keccak.html | Website}, and
 * {@link https://crypto.stackexchange.com/q/15727 | the differences between
 * SHA-3 and Keccak}.
 *
 * Check out `sha3-addons` module for cSHAKE, k12, and others.
 * @module
 */
// No __PURE__ annotations in sha3 header:
// EVERYTHING is in fact used on every export.
// Various per round constants calculations
const _0n = BigInt(0);
const _1n = BigInt(1);
const _2n = BigInt(2);
const _7n = BigInt(7);
const _256n = BigInt(256);
// FIPS 202 Algorithm 5 rc(): when the outgoing bit is 1, the 8-bit LFSR xors
// taps 0, 4, 5, and 6, which compresses to the feedback mask `0x71`.
const _0x71n = BigInt(0x71);
const SHA3_PI = [];
const SHA3_ROTL = [];
const _SHA3_IOTA = []; // no pure annotation: var is always used
for (let round = 0, R = _1n, x = 1, y = 0; round < 24; round++) {
    // Pi
    [x, y] = [y, (2 * x + 3 * y) % 5];
    SHA3_PI.push(2 * (5 * y + x));
    // Rotational
    SHA3_ROTL.push((((round + 1) * (round + 2)) / 2) % 64);
    // Iota
    let t = _0n;
    for (let j = 0; j < 7; j++) {
        R = ((R << _1n) ^ ((R >> _7n) * _0x71n)) % _256n;
        if (R & _2n)
            t ^= _1n << ((_1n << BigInt(j)) - _1n);
    }
    _SHA3_IOTA.push(t);
}
const IOTAS = split(_SHA3_IOTA, true);
// `split(..., true)` keeps the local little-endian lane-word layout used by
// `state32`, so these `H` / `L` tables follow the file's first-word /
// second-word lane slots rather than `_u64.ts`'s usual high/low naming.
const SHA3_IOTA_H = IOTAS[0];
const SHA3_IOTA_L = IOTAS[1];
// Left rotation (without 0, 32, 64)
const rotlH = (h, l, s) => (s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s));
const rotlL = (h, l, s) => (s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s));
/**
 * `keccakf1600` internal permutation, additionally allows adjusting the round count.
 * @param s - 5x5 Keccak state encoded as 25 lanes split into 50 uint32 words
 *   in this file's local little-endian lane-word order
 * @param rounds - number of rounds to execute
 * @throws If `rounds` is outside the supported `1..24` range. {@link Error}
 * @example
 * Permute a Keccak state with the default 24 rounds.
 * ```ts
 * keccakP(new Uint32Array(50));
 * ```
 */
function keccakP(s, rounds = 24) {
    anumber$2(rounds, 'rounds');
    // This implementation precomputes only the standard Keccak-f[1600] 24-round Iota table.
    if (rounds < 1 || rounds > 24)
        throw new Error('"rounds" expected integer 1..24');
    const B = new Uint32Array(5 * 2);
    // NOTE: all indices are x2 since we store state as u32 instead of u64 (bigints to slow in js)
    for (let round = 24 - rounds; round < 24; round++) {
        // Theta θ
        for (let x = 0; x < 10; x++)
            B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
        for (let x = 0; x < 10; x += 2) {
            const idx1 = (x + 8) % 10;
            const idx0 = (x + 2) % 10;
            const B0 = B[idx0];
            const B1 = B[idx0 + 1];
            const Th = rotlH(B0, B1, 1) ^ B[idx1];
            const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
            for (let y = 0; y < 50; y += 10) {
                s[x + y] ^= Th;
                s[x + y + 1] ^= Tl;
            }
        }
        // Rho (ρ) and Pi (π)
        let curH = s[2];
        let curL = s[3];
        for (let t = 0; t < 24; t++) {
            const shift = SHA3_ROTL[t];
            const Th = rotlH(curH, curL, shift);
            const Tl = rotlL(curH, curL, shift);
            const PI = SHA3_PI[t];
            curH = s[PI];
            curL = s[PI + 1];
            s[PI] = Th;
            s[PI + 1] = Tl;
        }
        // Chi (χ)
        // Same as:
        // for (let x = 0; x < 10; x++) B[x] = s[y + x];
        // for (let x = 0; x < 10; x++) s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
        for (let y = 0; y < 50; y += 10) {
            const b0 = s[y], b1 = s[y + 1], b2 = s[y + 2], b3 = s[y + 3];
            s[y] ^= ~s[y + 2] & s[y + 4];
            s[y + 1] ^= ~s[y + 3] & s[y + 5];
            s[y + 2] ^= ~s[y + 4] & s[y + 6];
            s[y + 3] ^= ~s[y + 5] & s[y + 7];
            s[y + 4] ^= ~s[y + 6] & s[y + 8];
            s[y + 5] ^= ~s[y + 7] & s[y + 9];
            s[y + 6] ^= ~s[y + 8] & b0;
            s[y + 7] ^= ~s[y + 9] & b1;
            s[y + 8] ^= ~b0 & b2;
            s[y + 9] ^= ~b1 & b3;
        }
        // Iota (ι)
        s[0] ^= SHA3_IOTA_H[round];
        s[1] ^= SHA3_IOTA_L[round];
    }
    clean$1(B);
}
/**
 * Keccak sponge function.
 * @param blockLen - absorb/squeeze rate in bytes
 * @param suffix - domain separation suffix byte
 * @param outputLen - default digest length in bytes. This base sponge only
 *   requires a non-negative integer; wrappers that need positive output
 *   lengths must enforce that themselves.
 * @param enableXOF - whether XOF output is allowed
 * @param rounds - number of Keccak-f rounds
 * @example
 * Build a sponge state, absorb bytes, then finalize a digest.
 * ```ts
 * const hash = new Keccak(136, 0x06, 32);
 * hash.update(new Uint8Array([1, 2, 3]));
 * hash.digest();
 * ```
 */
class Keccak {
    state;
    pos = 0;
    posOut = 0;
    finished = false;
    state32;
    destroyed = false;
    blockLen;
    suffix;
    outputLen;
    canXOF;
    enableXOF = false;
    rounds;
    // NOTE: we accept arguments in bytes instead of bits here.
    constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
        this.blockLen = blockLen;
        this.suffix = suffix;
        this.outputLen = outputLen;
        this.enableXOF = enableXOF;
        this.canXOF = enableXOF;
        this.rounds = rounds;
        // Can be passed from user as dkLen
        anumber$2(outputLen, 'outputLen');
        // 1600 = 5x5 matrix of 64bit.  1600 bits === 200 bytes
        // 0 < blockLen < 200
        if (!(0 < blockLen && blockLen < 200))
            throw new Error('only keccak-f1600 function is supported');
        this.state = new Uint8Array(200);
        this.state32 = u32$1(this.state);
    }
    clone() {
        return this._cloneInto();
    }
    keccak() {
        swap32IfBE$1(this.state32);
        keccakP(this.state32, this.rounds);
        swap32IfBE$1(this.state32);
        this.posOut = 0;
        this.pos = 0;
    }
    update(data) {
        aexists$1(this);
        abytes$2(data);
        const { blockLen, state } = this;
        const len = data.length;
        for (let pos = 0; pos < len;) {
            const take = Math.min(blockLen - this.pos, len - pos);
            for (let i = 0; i < take; i++)
                state[this.pos++] ^= data[pos++];
            if (this.pos === blockLen)
                this.keccak();
        }
        return this;
    }
    finish() {
        if (this.finished)
            return;
        this.finished = true;
        const { state, suffix, pos, blockLen } = this;
        // FIPS 202 appends the SHA3/SHAKE domain-separation suffix before pad10*1.
        // These byte values already include the first padding bit, while the
        // final `0x80` below supplies the closing `1` bit in the last rate byte.
        state[pos] ^= suffix;
        // If that combined suffix lands in the last rate byte and already sets
        // bit 7, absorb it first so the final pad10*1 bit can be xored into a
        // fresh block.
        if ((suffix & 0x80) !== 0 && pos === blockLen - 1)
            this.keccak();
        state[blockLen - 1] ^= 0x80;
        this.keccak();
    }
    writeInto(out) {
        aexists$1(this, false);
        abytes$2(out);
        this.finish();
        const bufferOut = this.state;
        const { blockLen } = this;
        for (let pos = 0, len = out.length; pos < len;) {
            if (this.posOut >= blockLen)
                this.keccak();
            const take = Math.min(blockLen - this.posOut, len - pos);
            out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
            this.posOut += take;
            pos += take;
        }
        return out;
    }
    xofInto(out) {
        // Plain SHA3/Keccak usage with XOF is probably a mistake, but this base
        // class is also reused by SHAKE/cSHAKE/KMAC/TupleHash/ParallelHash/
        // TurboSHAKE/KangarooTwelve wrappers that intentionally enable XOF.
        if (!this.enableXOF)
            throw new Error('XOF is not possible for this instance');
        return this.writeInto(out);
    }
    xof(bytes) {
        anumber$2(bytes);
        return this.xofInto(new Uint8Array(bytes));
    }
    digestInto(out) {
        aoutput$1(out, this);
        if (this.finished)
            throw new Error('digest() was already called');
        // `aoutput(...)` allows oversized buffers; digestInto() must fill only the advertised digest.
        this.writeInto(out.subarray(0, this.outputLen));
        this.destroy();
    }
    digest() {
        const out = new Uint8Array(this.outputLen);
        this.digestInto(out);
        return out;
    }
    destroy() {
        this.destroyed = true;
        clean$1(this.state);
    }
    _cloneInto(to) {
        const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
        to ||= new Keccak(blockLen, suffix, outputLen, enableXOF, rounds);
        // Reused destinations can come from a different rate/capacity variant, so clone must rewrite
        // the sponge geometry as well as the state words.
        to.blockLen = blockLen;
        to.state32.set(this.state32);
        to.pos = this.pos;
        to.posOut = this.posOut;
        to.finished = this.finished;
        to.rounds = rounds;
        // Suffix can change in cSHAKE
        to.suffix = suffix;
        to.outputLen = outputLen;
        to.enableXOF = enableXOF;
        // Clones must preserve the public capability bit too; `_KMAC` reuses this path and deep clone
        // tests compare instance fields directly, so leaving `canXOF` behind makes the clone lie.
        to.canXOF = this.canXOF;
        to.destroyed = this.destroyed;
        return to;
    }
}
const genKeccak = (suffix, blockLen, outputLen, info = {}) => createHasher(() => new Keccak(blockLen, suffix, outputLen), info);
/**
 * SHA3-256 hash function. Different from keccak-256.
 * @param msg - message bytes to hash
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA3-256.
 * ```ts
 * sha3_256(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha3_256 = /* @__PURE__ */ genKeccak(0x06, 136, 32, 
/* @__PURE__ */ oidNist(0x08));
/**
 * SHA3-512 hash function.
 * @param msg - message bytes to hash
 * @returns Digest bytes.
 * @example
 * Hash a message with SHA3-512.
 * ```ts
 * sha3_512(new Uint8Array([97, 98, 99]));
 * ```
 */
const sha3_512 = /* @__PURE__ */ genKeccak(0x06, 72, 64, 
/* @__PURE__ */ oidNist(0x0a));
const genShake$1 = (suffix, blockLen, outputLen, info = {}) => createHasher((opts = {}) => new Keccak(blockLen, suffix, opts.dkLen === undefined ? outputLen : opts.dkLen, true), info);
/**
 * SHAKE128 XOF with 128-bit security and a 16-byte default output.
 * @param msg - message bytes to hash
 * @param opts - Optional output-length override. See {@link ShakeOpts}.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHAKE128.
 * ```ts
 * shake128(new Uint8Array([97, 98, 99]), { dkLen: 32 });
 * ```
 */
const shake128 = 
/* @__PURE__ */
genShake$1(0x1f, 168, 16, /* @__PURE__ */ oidNist(0x0b));
/**
 * SHAKE256 XOF with 256-bit security and a 32-byte default output.
 * @param msg - message bytes to hash
 * @param opts - Optional output-length override. See {@link ShakeOpts}.
 * @returns Digest bytes.
 * @example
 * Hash a message with SHAKE256.
 * ```ts
 * shake256(new Uint8Array([97, 98, 99]), { dkLen: 64 });
 * ```
 */
const shake256 = 
/* @__PURE__ */
genShake$1(0x1f, 136, 32, /* @__PURE__ */ oidNist(0x0c));

/**
 * SHA3 (keccak) addons.
 *
 * * cSHAKE, KMAC, TupleHash, ParallelHash + XOF variants from
 *   {@link https://csrc.nist.gov/pubs/sp/800/185/final | NIST SP 800-185}
 * * KangarooTwelve 🦘 and TurboSHAKE - reduced-round keccak from
 *   {@link https://datatracker.ietf.org/doc/rfc9861/ | RFC 9861}
 * * KeccakPRG: Pseudo-random generator based on Keccak
 *   ({@link https://keccak.team/files/CSF-0.1.pdf | pdf})
 * @module
 */
// cSHAKE && KMAC (NIST SP800-185)
const _8n = /* @__PURE__ */ BigInt(8);
const _ffn = /* @__PURE__ */ BigInt(0xff);
// It is safe to use bigints here, since they used only for length encoding (not actual data).
// We use bigints in sha256 for lengths too.
// Callers are still expected to supply SP 800-185-valid lengths
// (`0 <= x < 2^2040`); this helper does not enforce that bound.
function leftEncode(n) {
    n = BigInt(n);
    const res = [Number(n & _ffn)];
    n >>= _8n;
    for (; n > 0; n >>= _8n)
        res.unshift(Number(n & _ffn));
    res.unshift(res.length);
    return new Uint8Array(res);
}
// Same caller contract as `leftEncode(...)`: lengths must already satisfy SP 800-185 §2.3.1.
function rightEncode(n) {
    n = BigInt(n);
    const res = [Number(n & _ffn)];
    n >>= _8n;
    for (; n > 0; n >>= _8n)
        res.unshift(Number(n & _ffn));
    res.push(res.length);
    return new Uint8Array(res);
}
// `dkLen` validation is deferred to the downstream Keccak constructor.
function chooseLen(opts, outputLen) {
    return opts.dkLen === undefined ? outputLen : opts.dkLen;
}
const abytesOrZero = (buf, title = '') => {
    if (buf === undefined)
        return EMPTY_BUFFER;
    abytes$2(buf, undefined, title);
    return buf;
};
// NOTE: second modulo is necessary since we don't need to add padding if the
// current element takes a whole block.
// Callers only pass the fixed positive Keccak rates here (`168` or `136`);
// `block <= 0` is not validated locally.
const getPadding = (len, block) => new Uint8Array((block - (len % block)) % block);
// Personalization
function cshakePers(hash, opts = {}) {
    const h = hash;
    if (!opts || (opts.personalization === undefined && opts.NISTfn === undefined))
        return h;
    // Encode and pad inplace to avoid unneccesary memory copies/slices so we
    // don't need to zero them later.
    // bytepad(encode_string(N) || encode_string(S), rate), where `rate` is the
    // current cSHAKE/KMAC/TupleHash/ParallelHash block length.
    const blockLenBytes = leftEncode(h.blockLen);
    const fn = opts.NISTfn === undefined ? EMPTY_BUFFER : kdfInputToBytes(opts.NISTfn);
    const fnLen = leftEncode(_8n * BigInt(fn.length)); // length in bits
    const pers = abytesOrZero(opts.personalization, 'personalization');
    const persLen = leftEncode(_8n * BigInt(pers.length)); // length in bits
    if (!fn.length && !pers.length)
        return h;
    // SP 800-185 cSHAKE appends `00` instead of SHAKE's `1111`; in this Keccak implementation
    // that changes the delimited suffix byte from `0x1f` to `0x04` once N or S is non-empty.
    h.suffix = 0x04;
    h.update(blockLenBytes).update(fnLen).update(fn).update(persLen).update(pers);
    let totalLen = blockLenBytes.length + fnLen.length + fn.length + persLen.length + pers.length;
    h.update(getPadding(totalLen, h.blockLen));
    return h;
}
/**
 * Internal KMAC class.
 * SP 800-185 §8.4.1 still recommends keys at least as long as the target
 * security strength.
 */
class _KMAC extends Keccak {
    constructor(blockLen, outputLen, enableXOF, key, opts = {}) {
        super(blockLen, 0x1f, outputLen, enableXOF);
        // Preload T = bytepad(encode_string("KMAC") || encode_string(S), rate); later updates append
        // newX = bytepad(encode_string(K), rate) || X and `finish()` appends right_encode(L or 0).
        cshakePers(this, {
            NISTfn: 'KMAC',
            personalization: opts.personalization,
        });
        abytes$2(key, undefined, 'key');
        // 1. newX = bytepad(encode_string(K), rate) || X || right_encode(L),
        // with `rate = this.blockLen`.
        const blockLenBytes = leftEncode(this.blockLen);
        const keyLen = leftEncode(_8n * BigInt(key.length));
        this.update(blockLenBytes).update(keyLen).update(key);
        const totalLen = blockLenBytes.length + keyLen.length + key.length;
        this.update(getPadding(totalLen, this.blockLen));
    }
    finish() {
        // SP 800-185 uses right_encode(L) for fixed-length KMAC and right_encode(0) for KMACXOF.
        // outputLen in bits
        if (!this.finished)
            this.update(rightEncode(this.enableXOF ? 0 : _8n * BigInt(this.outputLen)));
        super.finish();
    }
    _cloneInto(to) {
        // Create new instance without calling constructor since the key
        // is already in state and we don't know it.
        // Force "to" to be instance of KMAC instead of Sha3.
        if (!to) {
            to = Object.create(Object.getPrototypeOf(this), {});
            to.state = this.state.slice();
            to.blockLen = this.blockLen;
            to.state32 = u32$1(to.state);
        }
        return super._cloneInto(to);
    }
    clone() {
        return this._cloneInto();
    }
}
function genKmac(blockLen, outputLen, xof = false) {
    // One-shot XOF wrappers still finalize via `.digest()` because `_KMAC`
    // already bakes the requested output length into the state.
    const kmac = (key, message, opts) => kmac.create(key, opts).update(message).digest();
    kmac.create = (key, opts = {}) => new _KMAC(blockLen, chooseLen(opts, outputLen), xof, key, opts);
    return kmac;
}
/**
 * 256-bit Keccak-MAC XOF.
 * @param key - MAC key bytes
 * @param message - message bytes to authenticate
 * @param opts - Optional output and personalization settings. Defaults to
 *   32 output bytes when `dkLen` is omitted. See {@link cShakeOpts}.
 * @returns Authentication tag bytes.
 * @example
 * Authenticate a message with KMAC256 XOF output.
 * ```ts
 * kmac256xof(new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6]), { dkLen: 64 });
 * ```
 */
const kmac256xof = /* @__PURE__ */ genKmac(136, 32, true);
const EMPTY_BUFFER = /* @__PURE__ */ Uint8Array.of();
/**
 * More at
 * {@link https://github.com/XKCP/XKCP/tree/master/lib/high/Keccak/PRG}.
 * Accepted capacities must keep `rho = 1598 - capacity` byte-aligned, and
 * `.clean()` later also requires `rate > 801`.
 */
class _KeccakPRG extends Keccak {
    rate;
    constructor(capacity) {
        anumber$2(capacity);
        const rate = 1600 - capacity;
        const rho = rate - 2;
        // Rho must be full bytes
        if (capacity < 0 || capacity > 1600 - 10 || rho % 8)
            throw new Error('invalid capacity');
        // blockLen = rho in bytes
        super(rho / 8, 0, 0, true);
        this.rate = rate;
        this.posOut = Math.floor((rate + 7) / 8);
    }
    keccak() {
        // Duplex padding
        this.state[this.pos] ^= 0x01;
        this.state[this.blockLen] ^= 0x02; // Rho is full bytes
        super.keccak();
        this.pos = 0;
        this.posOut = 0;
    }
    update(data) {
        super.update(data);
        this.posOut = this.blockLen;
        return this;
    }
    finish() { }
    digestInto(_out) {
        throw new Error('digest is not allowed, use .randomBytes() instead');
    }
    addEntropy(seed) {
        this.update(seed);
    }
    randomBytes(length) {
        return this.xof(length);
    }
    clean() {
        // clean() mutates live sponge state just like randomBytes(),
        // so destroyed instances must reject it.
        aexists$1(this, false);
        if (this.rate < 1600 / 2 + 1)
            throw new Error('rate is too low to use .forget()');
        this.keccak();
        for (let i = 0; i < this.blockLen; i++)
            this.state[i] = 0;
        this.pos = this.blockLen;
        this.keccak();
        this.posOut = this.blockLen;
    }
    _cloneInto(to) {
        const { rate } = this;
        to ||= new _KeccakPRG(1600 - rate);
        super._cloneInto(to);
        to.rate = rate;
        return to;
    }
    clone() {
        return this._cloneInto();
    }
}
/**
 * KeccakPRG: pseudo-random generator based on Keccak.
 * See {@link https://keccak.team/files/CSF-0.1.pdf}.
 * @param capacity - sponge capacity in bits. Accepted values are those that
 *   keep `rho = 1598 - capacity` byte-aligned; the default `254` is chosen
 *   because it satisfies that duplex layout while leaving a wide byte-aligned
 *   rate.
 * @returns PRG instance backed by a Keccak sponge.
 * @example
 * Create a Keccak-based pseudorandom generator and read bytes from it.
 * ```ts
 * const prg = keccakprg(254);
 * prg.randomBytes(8);
 * ```
 */
const keccakprg = (capacity = 254) => new _KeccakPRG(capacity);

/**
 * Utilities for hex, bytearray and number handling.
 * @module
 */
/*! noble-post-quantum - MIT License (c) 2024 Paul Miller (paulmillr.com) */
/**
 * Asserts that a value is a byte array and optionally checks its length.
 * Returns the original reference unchanged on success, and currently also accepts Node `Buffer`
 * values through the upstream validator.
 * This helper throws on malformed input, so APIs that must return `false` need to guard lengths
 * before decoding or before calling it.
 * @example
 * Validate that a value is a byte array with the expected length.
 * ```ts
 * abytes(new Uint8Array([1]), 1);
 * ```
 */
const abytesDoc = abytes$2;
/**
 * Returns cryptographically secure random bytes.
 * Requires `globalThis.crypto.getRandomValues` and throws if that API is unavailable.
 * `bytesLength` is validated by the upstream helper as a non-negative integer before allocation,
 * so negative and fractional values both throw instead of truncating through JS `ToIndex`.
 * @param bytesLength - Number of random bytes to generate.
 * @returns Fresh random bytes.
 * @example
 * Generate a fresh random seed.
 * ```ts
 * const seed = randomBytes(4);
 * ```
 */
const randomBytes$1 = randomBytes$3;
/**
 * Compares two byte arrays in a length-constant way for equal lengths.
 * Unequal lengths return `false` immediately, and there is no runtime type validation.
 * @param a - First byte array.
 * @param b - Second byte array.
 * @returns Whether both arrays contain the same bytes.
 * @example
 * Compare two byte arrays for equality.
 * ```ts
 * equalBytes(new Uint8Array([1]), new Uint8Array([1]));
 * ```
 */
function equalBytes$1(a, b) {
    if (a.length !== b.length)
        return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++)
        diff |= a[i] ^ b[i];
    return diff === 0;
}
/**
 * Copies bytes into a fresh `Uint8Array`.
 * Returns a detached plain `Uint8Array` after validating that the input is real bytes.
 * @param bytes - Source bytes.
 * @returns Copy of the input bytes.
 * @example
 * Copy bytes into a fresh array.
 * ```ts
 * copyBytes(new Uint8Array([1, 2]));
 * ```
 */
function copyBytes$1(bytes) {
    // `Uint8Array.from(...)` would also accept arrays / other typed arrays. Keep this helper strict
    // because callers use it at byte-validation boundaries before mutating the detached copy.
    return Uint8Array.from(abytes$2(bytes));
}
/**
 * Validates that an options bag is a plain object.
 * @param opts - Options object to validate.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Validate that an options bag is a plain object.
 * ```ts
 * validateOpts({});
 * ```
 */
function validateOpts(opts) {
    // Arrays silently passed here before, but these call sites expect named option-bag fields.
    if (Object.prototype.toString.call(opts) !== '[object Object]')
        throw new TypeError('expected valid options object');
}
/**
 * Validates common verification options.
 * `context` itself is validated with `abytes(...)`, and individual algorithms may narrow support
 * further after this shared plain-object gate.
 * @param opts - Verification options. See {@link VerOpts}.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Validate common verification options.
 * ```ts
 * validateVerOpts({ context: new Uint8Array([1]) });
 * ```
 */
function validateVerOpts(opts) {
    validateOpts(opts);
    if (opts.context !== undefined)
        abytes$2(opts.context, undefined, 'opts.context');
}
/**
 * Validates common signing options.
 * `extraEntropy` is validated with `abytes(...)`; exact lengths and extra algorithm-specific
 * restrictions are enforced later by callers.
 * @param opts - Signing options. See {@link SigOpts}.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Validate common signing options.
 * ```ts
 * validateSigOpts({ extraEntropy: new Uint8Array([1]) });
 * ```
 */
function validateSigOpts(opts) {
    validateVerOpts(opts);
    if (opts.extraEntropy !== false && opts.extraEntropy !== undefined)
        abytes$2(opts.extraEntropy, undefined, 'opts.extraEntropy');
}
/**
 * Builds a fixed-layout coder from byte lengths and nested coders.
 * Raw-length fields decode as zero-copy `subarray(...)` views, and nested coders may preserve that
 * aliasing too. Nested coder `encode(...)` results are treated as owned scratch: `splitCoder`
 * copies them into the output and then zeroizes them with `fill(0)`. If a nested encoder forwards
 * caller-owned bytes, it must do so only after detaching them into a disposable copy.
 * @param label - Label used in validation errors.
 * @param lengths - Field lengths or nested coders.
 * @returns Composite fixed-length coder.
 * @example
 * Build a fixed-layout coder from byte lengths and nested coders.
 * ```ts
 * splitCoder('demo', 1, 2).encode([new Uint8Array([1]), new Uint8Array([2, 3])]);
 * ```
 */
function splitCoder(label, ...lengths) {
    const getLength = (c) => typeof c === 'number' ? c : c.bytesLen;
    const bytesLen = lengths.reduce((sum, a) => sum + getLength(a), 0);
    return {
        bytesLen,
        encode: (bufs) => {
            const res = new Uint8Array(bytesLen);
            for (let i = 0, pos = 0; i < lengths.length; i++) {
                const c = lengths[i];
                const l = getLength(c);
                const b = typeof c === 'number' ? bufs[i] : c.encode(bufs[i]);
                abytes$2(b, l, label);
                res.set(b, pos);
                if (typeof c !== 'number')
                    b.fill(0); // clean
                pos += l;
            }
            return res;
        },
        decode: (buf) => {
            abytes$2(buf, bytesLen, label);
            const res = [];
            for (const c of lengths) {
                const l = getLength(c);
                const b = buf.subarray(0, l);
                res.push(typeof c === 'number' ? b : c.decode(b));
                buf = buf.subarray(l);
            }
            return res;
        },
    };
}
// nano-packed.array (fixed size)
/**
 * Builds a fixed-length vector coder from another fixed-length coder.
 * Element decoding receives `subarray(...)` views, so aliasing depends on the element coder.
 * Element coder `encode(...)` results are treated as owned scratch: `vecCoder` copies them into
 * the output and then zeroizes them with `fill(0)`. If an element encoder forwards caller-owned
 * bytes, it must do so only after detaching them into a disposable copy. `vecCoder` also trusts
 * the `BytesCoderLen` contract: each encoded element must already be exactly `c.bytesLen` bytes.
 * @param c - Element coder.
 * @param vecLen - Number of elements in the vector.
 * @returns Fixed-length vector coder.
 * @example
 * Build a fixed-length vector coder from another fixed-length coder.
 * ```ts
 * vecCoder(
 *   { bytesLen: 1, encode: (n: number) => Uint8Array.of(n), decode: (b: Uint8Array) => b[0] || 0 },
 *   2
 * ).encode([1, 2]);
 * ```
 */
function vecCoder(c, vecLen) {
    const coder = c;
    const bytesLen = vecLen * coder.bytesLen;
    return {
        bytesLen,
        encode: (u) => {
            if (u.length !== vecLen)
                throw new RangeError(`vecCoder.encode: wrong length=${u.length}. Expected: ${vecLen}`);
            const res = new Uint8Array(bytesLen);
            for (let i = 0, pos = 0; i < u.length; i++) {
                const b = coder.encode(u[i]);
                res.set(b, pos);
                b.fill(0); // clean
                pos += b.length;
            }
            return res;
        },
        decode: (a) => {
            abytes$2(a, bytesLen);
            const r = [];
            for (let i = 0; i < a.length; i += coder.bytesLen)
                r.push(coder.decode(a.subarray(i, i + coder.bytesLen)));
            return r;
        },
    };
}
/**
 * Overwrites supported typed-array inputs with zeroes in place.
 * Accepts direct typed arrays and one-level arrays of them.
 * @param list - Typed arrays or one-level lists of typed arrays to clear.
 * @example
 * Overwrite typed arrays with zeroes.
 * ```ts
 * const buf = Uint8Array.of(1, 2, 3);
 * cleanBytes(buf);
 * ```
 */
function cleanBytes(...list) {
    for (const t of list) {
        if (Array.isArray(t))
            for (const b of t)
                b.fill(0);
        else
            t.fill(0);
    }
}
/**
 * Creates a 32-bit mask with the lowest `bits` bits set.
 * @param bits - Number of low bits to keep.
 * @returns Bit mask with `bits` ones.
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Create a low-bit mask for packed-field operations.
 * ```ts
 * const mask = getMask(4);
 * ```
 */
function getMask(bits) {
    if (!Number.isSafeInteger(bits) || bits < 0 || bits > 32)
        throw new RangeError(`expected bits in [0..32], got ${bits}`);
    // JS shifts are modulo 32, so bit 32 needs an explicit full-width mask.
    return bits === 32 ? 0xffffffff : ~(-1 << bits) >>> 0;
}
/** Shared empty byte array used as the default context. */
const EMPTY = /* @__PURE__ */ Uint8Array.of();
/**
 * Builds the domain-separated message payload for the pure sign/verify paths.
 * Context length `255` is valid; only `ctx.length > 255` is rejected.
 * @param msg - Message bytes.
 * @param ctx - Optional context bytes.
 * @returns Domain-separated message payload.
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Build the domain-separated payload before direct signing.
 * ```ts
 * const payload = getMessage(new Uint8Array([1, 2]));
 * ```
 */
function getMessage(msg, ctx = EMPTY) {
    abytes$2(msg);
    abytes$2(ctx);
    if (ctx.length > 255)
        throw new RangeError('context should be 255 bytes or less');
    return concatBytes$1(new Uint8Array([0, ctx.length]), ctx, msg);
}
// DER tag+length plus the shared NIST hash OID arc 2.16.840.1.101.3.4.2.* used by the
// FIPS 204 / FIPS 205 pre-hash wrappers; the final byte selects SHA-256, SHA-512, SHAKE128,
// SHAKE256, or another approved hash/XOF under that subtree.
// 06 09 60 86 48 01 65 03 04 02
const oidNistP = /* @__PURE__ */ Uint8Array.from([6, 9, 0x60, 0x86, 0x48, 1, 0x65, 3, 4, 2]);
/**
 * Validates that a hash exposes a NIST hash OID and enough collision resistance.
 * Current accepted surface is broader than the FIPS algorithm tables: any hash/XOF under the NIST
 * `2.16.840.1.101.3.4.2.*` subtree is accepted if its effective `outputLen` is strong enough.
 * XOF callers must pass a callable whose `outputLen` matches the digest length they actually intend
 * to sign; bare `shake128` / `shake256` defaults are too short for the stronger prehash modes.
 * @param hash - Hash function to validate.
 * @param requiredStrength - Minimum required collision-resistance strength in bits.
 * @throws If the hash metadata or collision resistance is insufficient. {@link Error}
 * @example
 * Validate that a hash exposes a NIST hash OID and enough collision resistance.
 * ```ts
 * import { sha256 } from '@noble/hashes/sha2.js';
 * import { checkHash } from '@noble/post-quantum/utils.js';
 * checkHash(sha256, 128);
 * ```
 */
function checkHash(hash, requiredStrength = 0) {
    if (!hash.oid || !equalBytes$1(hash.oid.subarray(0, 10), oidNistP))
        throw new Error('hash.oid is invalid: expected NIST hash');
    // FIPS 204 / FIPS 205 require both collision and second-preimage strength; for approved NIST
    // hashes/XOFs under this OID subtree, the collision bound from the configured digest length is
    // the tighter runtime check, so enforce that lower bound here.
    const collisionResistance = (hash.outputLen * 8) / 2;
    if (requiredStrength > collisionResistance) {
        throw new Error('Pre-hash security strength too low: ' +
            collisionResistance +
            ', required: ' +
            requiredStrength);
    }
}
/**
 * Builds the domain-separated prehash payload for the prehash sign/verify paths.
 * Callers are expected to vet `hash.oid` first, e.g. via `checkHash(...)`; calling this helper
 * directly with a hash object that lacks `oid` currently throws later inside `concatBytes(...)`.
 * Context length `255` is valid; only `ctx.length > 255` is rejected.
 * @param hash - Prehash function.
 * @param msg - Message bytes.
 * @param ctx - Optional context bytes.
 * @returns Domain-separated prehash payload.
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Build the domain-separated prehash payload for external hashing.
 * ```ts
 * import { sha256 } from '@noble/hashes/sha2.js';
 * import { getMessagePrehash } from '@noble/post-quantum/utils.js';
 * getMessagePrehash(sha256, new Uint8Array([1, 2]));
 * ```
 */
function getMessagePrehash(hash, msg, ctx = EMPTY) {
    abytes$2(msg);
    abytes$2(ctx);
    if (ctx.length > 255)
        throw new RangeError('context should be 255 bytes or less');
    const hashed = hash(msg);
    return concatBytes$1(new Uint8Array([1, ctx.length]), ctx, hash.oid, hashed);
}

/**
 * Internal methods for lattice-based ML-KEM and ML-DSA.
 * @module
 */
/*! noble-post-quantum - MIT License (c) 2024 Paul Miller (paulmillr.com) */
/**
 * Creates shared modular arithmetic, NTT, and packing helpers for CRYSTALS schemes.
 * @param opts - Polynomial and transform parameters. See {@link CrystalOpts}.
 * @returns CRYSTALS arithmetic and encoding helpers.
 * @example
 * Create shared modular arithmetic and NTT helpers for a CRYSTALS parameter set.
 * ```ts
 * const crystals = genCrystals({
 *   newPoly: (n) => new Uint16Array(n),
 *   N: 256,
 *   Q: 3329,
 *   F: 3303,
 *   ROOT_OF_UNITY: 17,
 *   brvBits: 7,
 *   isKyber: true,
 * });
 * const reduced = crystals.mod(-1);
 * ```
 */
const genCrystals = (opts) => {
    // isKyber: true means Kyber, false means Dilithium
    const { newPoly, N, Q, F, ROOT_OF_UNITY, brvBits, isKyber } = opts;
    // Normalize JS `%` into the canonical Z_m representative `[0, modulo-1]` expected by
    // FIPS 203 §2.3 / FIPS 204 §2.3 before downstream mod-q arithmetic.
    const mod = (a, modulo = Q) => {
        const result = a % modulo | 0;
        return (result >= 0 ? result | 0 : (modulo + result) | 0) | 0;
    };
    // FIPS 204 §7.4 uses the centered `mod ±` representative for low bits, keeping the
    // positive midpoint when `modulo` is even.
    // Center to `[-floor((modulo-1)/2), floor(modulo/2)]`.
    const smod = (a, modulo = Q) => {
        const r = mod(a, modulo) | 0;
        return (r > modulo >> 1 ? (r - modulo) | 0 : r) | 0;
    };
    // Kyber uses the FIPS 203 Appendix A `BitRev_7` table here via the first 128 entries, while
    // Dilithium uses the FIPS 204 §7.5 / Appendix B `BitRev_8` zetas table over all 256 entries.
    function getZettas() {
        const out = newPoly(N);
        for (let i = 0; i < N; i++) {
            const b = reverseBits(i, brvBits);
            const p = BigInt(ROOT_OF_UNITY) ** BigInt(b) % BigInt(Q);
            out[i] = Number(p) | 0;
        }
        return out;
    }
    const nttZetas = getZettas();
    // Number-Theoretic Transform
    // Explained: https://electricdusk.com/ntt.html
    // Kyber has slightly different params, since there is no 512th primitive root of unity mod q,
    // only 256th primitive root of unity mod. Which also complicates MultiplyNTT.
    const field = {
        add: (a, b) => mod((a | 0) + (b | 0)) | 0,
        sub: (a, b) => mod((a | 0) - (b | 0)) | 0,
        mul: (a, b) => mod((a | 0) * (b | 0)) | 0,
        inv: (_a) => {
            throw new Error('not implemented');
        },
    };
    const nttOpts = {
        N,
        roots: nttZetas,
        invertButterflies: true,
        skipStages: isKyber ? 1 : 0,
        brp: false,
    };
    const dif = FFTCore(field, { dit: false, ...nttOpts });
    const dit = FFTCore(field, { dit: true, ...nttOpts });
    const NTT = {
        encode: (r) => {
            return dif(r);
        },
        decode: (r) => {
            dit(r);
            // The inverse-NTT normalization factor is family-specific: FIPS 203 Algorithm 10 line 14
            // uses `128^-1 mod q` for Kyber, while FIPS 204 Algorithm 42 lines 21-23 use `256^-1 mod q`.
            // kyber uses 128 here, because brv && stuff
            for (let i = 0; i < r.length; i++)
                r[i] = mod(F * r[i]);
            return r;
        },
    };
    // Pack one little-endian `d`-bit word per coefficient, matching FIPS 203 ByteEncode /
    // ByteDecode and the FIPS 204 BitsToBytes-based polynomial packing helpers.
    const bitsCoder = (d, c) => {
        const mask = getMask(d);
        const bytesLen = d * (N / 8);
        return {
            bytesLen,
            encode: (poly_) => {
                const poly = poly_;
                const r = new Uint8Array(bytesLen);
                for (let i = 0, buf = 0, bufLen = 0, pos = 0; i < poly.length; i++) {
                    buf |= (c.encode(poly[i]) & mask) << bufLen;
                    bufLen += d;
                    for (; bufLen >= 8; bufLen -= 8, buf >>= 8)
                        r[pos++] = buf & getMask(bufLen);
                }
                return r;
            },
            decode: (bytes) => {
                const r = newPoly(N);
                for (let i = 0, buf = 0, bufLen = 0, pos = 0; i < bytes.length; i++) {
                    buf |= bytes[i] << bufLen;
                    bufLen += 8;
                    for (; bufLen >= d; bufLen -= d, buf >>= d)
                        r[pos++] = c.decode(buf & mask);
                }
                return r;
            },
        };
    };
    return {
        mod,
        smod,
        nttZetas: nttZetas,
        NTT: {
            encode: (r) => NTT.encode(r),
            decode: (r) => NTT.decode(r),
        },
        bitsCoder: bitsCoder,
    };
};
const createXofShake = (shake) => (seed, blockLen) => {
    if (!blockLen)
        blockLen = shake.blockLen;
    // Optimizations that won't mater:
    // - cached seed update (two .update(), on start and on the end)
    // - another cache which cloned into working copy
    // Faster than multiple updates, since seed less than blockLen
    const _seed = new Uint8Array(seed.length + 2);
    _seed.set(seed);
    const seedLen = seed.length;
    const buf = new Uint8Array(blockLen); // == shake128.blockLen
    let h = shake.create({});
    let calls = 0;
    let xofs = 0;
    return {
        stats: () => ({ calls, xofs }),
        get: (x, y) => {
            // Rebind to `seed || x || y` so callers can implement the spec's per-coordinate
            // SHAKE inputs like `rho || j || i` and `rho || IntegerToBytes(counter, 2)`.
            _seed[seedLen + 0] = x;
            _seed[seedLen + 1] = y;
            h.destroy();
            h = shake.create({}).update(_seed);
            calls++;
            return () => {
                xofs++;
                return h.xofInto(buf);
            };
        },
        clean: () => {
            h.destroy();
            cleanBytes(buf, _seed);
        },
    };
};
/**
 * SHAKE128-based extendable-output reader factory used by ML-KEM.
 * `get(x, y)` selects one coordinate pair at a time; calling it again invalidates previously
 * returned readers, and each squeeze reuses one mutable internal output buffer.
 * @param seed - Seed bytes for the reader.
 * @param blockLen - Optional output block length.
 * @returns Stateful XOF reader.
 * @example
 * Build the ML-KEM SHAKE128 matrix expander and read one block.
 * ```ts
 * import { randomBytes } from '@noble/post-quantum/utils.js';
 * import { XOF128 } from '@noble/post-quantum/_crystals.js';
 * const reader = XOF128(randomBytes(32));
 * const block = reader.get(0, 0)();
 * ```
 */
const XOF128 = /* @__PURE__ */ createXofShake(shake128);
/**
 * SHAKE256-based extendable-output reader factory used by ML-DSA.
 * `get(x, y)` appends raw one-byte coordinates to the seed, invalidates previously returned
 * readers, and reuses one mutable internal output buffer for each squeeze.
 * @param seed - Seed bytes for the reader.
 * @param blockLen - Optional output block length.
 * @returns Stateful XOF reader.
 * @example
 * Build the ML-DSA SHAKE256 coefficient expander and read one block.
 * ```ts
 * import { randomBytes } from '@noble/post-quantum/utils.js';
 * import { XOF256 } from '@noble/post-quantum/_crystals.js';
 * const reader = XOF256(randomBytes(32));
 * const block = reader.get(0, 0)();
 * ```
 */
const XOF256 = /* @__PURE__ */ createXofShake(shake256);

/**
 * ML-DSA: Module Lattice-based Digital Signature Algorithm from
 * [FIPS-204](https://csrc.nist.gov/pubs/fips/204/ipd). A.k.a. CRYSTALS-Dilithium.
 *
 * Has similar internals to ML-KEM, but their keys and params are different.
 * Check out [official site](https://www.pq-crystals.org/dilithium/index.shtml),
 * [repo](https://github.com/pq-crystals/dilithium).
 * @module
 */
/*! noble-post-quantum - MIT License (c) 2024 Paul Miller (paulmillr.com) */
function validateInternalOpts(opts) {
    validateOpts(opts);
    if (opts.externalMu !== undefined)
        abool$1(opts.externalMu, 'opts.externalMu');
}
// Constants
// FIPS 204 fixes ML-DSA over R = Z[X]/(X^256 + 1), so every polynomial has 256 coefficients.
const N$1 = 256;
// 2**23 − 2**13 + 1, 23 bits: multiply will be 46. We have enough precision in JS to avoid bigints
const Q$1 = 8380417;
// FIPS 204 §2.5 / Table 1 fixes zeta = 1753 as the 512th root of unity used by ML-DSA's NTT.
const ROOT_OF_UNITY$1 = 1753;
// f = 256**−1 mod q, pow(256, -1, q) = 8347681 (python3)
const F$1 = 8347681;
// FIPS 204 Table 1 / §7.4 fixes d = 13 dropped low bits for Power2Round on t.
const D = 13;
// FIPS 204 Table 1 fixes gamma2 to (q-1)/88 for ML-DSA-44 and (q-1)/32 for ML-DSA-65/87;
// §7.4 then uses alpha = 2*gamma2 for Decompose / MakeHint / UseHint.
// Dilithium is kinda parametrized over GAMMA2, but everything will break with any other value.
const GAMMA2_1 = Math.floor((Q$1 - 1) / 88) | 0;
const GAMMA2_2 = Math.floor((Q$1 - 1) / 32) | 0;
/** Internal params for different versions of ML-DSA  */
// prettier-ignore
/** Built-in ML-DSA parameter presets keyed by security categories `2/3/5`
 * for `ml_dsa44` / `ml_dsa65` / `ml_dsa87`.
 * This is only the Table 1 subset used directly here: `BETA = TAU * ETA` is derived later,
 * while `C_TILDE_BYTES`, `TR_BYTES`, `CRH_BYTES`, and `securityLevel` live in the preset wrappers.
 */
const PARAMS$2 = /* @__PURE__ */ (() => Object.freeze({
    2: Object.freeze({
        K: 4, L: 4, D, GAMMA1: 2 ** 17, GAMMA2: GAMMA2_1, TAU: 39, ETA: 2, OMEGA: 80
    }),
    3: Object.freeze({
        K: 6, L: 5, D, GAMMA1: 2 ** 19, GAMMA2: GAMMA2_2, TAU: 49, ETA: 4, OMEGA: 55
    }),
    5: Object.freeze({
        K: 8, L: 7, D, GAMMA1: 2 ** 19, GAMMA2: GAMMA2_2, TAU: 60, ETA: 2, OMEGA: 75
    }),
}))();
const newPoly = (n) => new Int32Array(n);
// Shared CRYSTALS helper in the ML-DSA branch: non-Kyber mode, 8-bit bit-reversal,
// and Int32Array polys because ordinary-form coefficients can be negative / centered.
const crystals$1 = /* @__PURE__ */ genCrystals({
    N: N$1,
    Q: Q$1,
    F: F$1,
    ROOT_OF_UNITY: ROOT_OF_UNITY$1,
    newPoly,
    isKyber: false,
    brvBits: 8,
});
const id = (n) => n;
// compress()/verify() must be compatible in both directions:
// wrap the shared d-bit packer with the FIPS 204 SimpleBitPack / BitPack coefficient maps.
// malformed-input rejection only happens through the optional verify hook.
const polyCoder$1 = (d, compress = id, verify = id) => crystals$1.bitsCoder(d, {
    encode: (i) => compress(verify(i)),
    decode: (i) => verify(compress(i)),
});
// Mutates `a` in place; callers must pass same-length polynomials.
const polyAdd$1 = (a_, b_) => {
    const a = a_;
    const b = b_;
    for (let i = 0; i < a.length; i++)
        a[i] = crystals$1.mod(a[i] + b[i]);
    return a;
};
// Mutates `a` in place; callers must pass same-length polynomials.
const polySub$1 = (a_, b_) => {
    const a = a_;
    const b = b_;
    for (let i = 0; i < a.length; i++)
        a[i] = crystals$1.mod(a[i] - b[i]);
    return a;
};
// Mutates `p` in place and assumes it is a decoded `t1`-range polynomial.
const polyShiftl = (p_) => {
    const p = p_;
    for (let i = 0; i < N$1; i++)
        p[i] <<= D;
    return p;
};
const polyChknorm = (p_, B) => {
    const p = p_;
    // FIPS 204 Algorithms 7 and 8 express the same centered-norm check with explicit inequalities.
    for (let i = 0; i < N$1; i++)
        if (Math.abs(crystals$1.smod(p[i])) >= B)
            return true;
    return false;
};
// Both inputs must already be in NTT / `T_q` form.
const MultiplyNTTs$1 = (a_, b_) => {
    const a = a_;
    const b = b_;
    // NOTE: we don't use montgomery reduction in code, since it requires 64 bit ints,
    // which is not available in JS. mod(a[i] * b[i]) is ok, since Q is 23 bit,
    // which means a[i] * b[i] is 46 bit, which is safe to use in JS. (number is 53 bits).
    // Barrett reduction is slower than mod :(
    const c = newPoly(N$1);
    for (let i = 0; i < a.length; i++)
        c[i] = crystals$1.mod(a[i] * b[i]);
    return c;
};
// Return poly in NTT representation
function RejNTTPoly(xof_) {
    const xof = xof_;
    // Samples a polynomial ∈ Tq. xof() must return byte lengths divisible by 3.
    const r = newPoly(N$1);
    // NOTE: we can represent 3xu24 as 4xu32, but it doesn't improve perf :(
    for (let j = 0; j < N$1;) {
        const b = xof();
        if (b.length % 3)
            throw new Error('RejNTTPoly: unaligned block');
        for (let i = 0; j < N$1 && i <= b.length - 3; i += 3) {
            // FIPS 204 Algorithm 14 clears the top bit of b2 before forming the 23-bit candidate.
            const t = (b[i + 0] | (b[i + 1] << 8) | (b[i + 2] << 16)) & 0x7fffff; // 3 bytes
            if (t < Q$1)
                r[j++] = t;
        }
    }
    return r;
}
// Instantiate one ML-DSA parameter set from the Table 1 lattice constants plus the
// Table 2 byte lengths / hash-width choices used by the public wrappers below.
function getDilithium(opts_) {
    const opts = opts_;
    const { K, L, GAMMA1, GAMMA2, TAU, ETA, OMEGA } = opts;
    const { CRH_BYTES, TR_BYTES, C_TILDE_BYTES, XOF128, XOF256, securityLevel } = opts;
    if (![2, 4].includes(ETA))
        throw new Error('Wrong ETA');
    if (![1 << 17, 1 << 19].includes(GAMMA1))
        throw new Error('Wrong GAMMA1');
    if (![GAMMA2_1, GAMMA2_2].includes(GAMMA2))
        throw new Error('Wrong GAMMA2');
    const BETA = TAU * ETA;
    const decompose = (r) => {
        // Decomposes r into (r1, r0) such that r ≡ r1(2γ2) + r0 mod q.
        const rPlus = crystals$1.mod(r);
        const r0 = crystals$1.smod(rPlus, 2 * GAMMA2) | 0;
        // FIPS 204 Algorithm 36 folds the top bucket `q-1` back to `(r1, r0) = (0, r0-1)`.
        if (rPlus - r0 === Q$1 - 1)
            return { r1: 0 | 0, r0: (r0 - 1) | 0 };
        const r1 = Math.floor((rPlus - r0) / (2 * GAMMA2)) | 0;
        return { r1, r0 }; // r1 = HighBits, r0 = LowBits
    };
    const HighBits = (r) => decompose(r).r1;
    const LowBits = (r) => decompose(r).r0;
    const MakeHint = (z, r) => {
        // Compute hint bit indicating whether adding z to r alters the high bits of r.
        // FIPS 204 §6.2 also permits the Section 5.1 alternative from [6], which uses the
        // transformed low-bits/high-bits state at this call site instead of Algorithm 39 literally.
        // This optimized predicate only applies to those transformed Section 5.1 inputs; it is
        // not a drop-in replacement for Algorithm 39 on arbitrary `(z, r)` pairs.
        // From dilithium code
        const res0 = z <= GAMMA2 || z > Q$1 - GAMMA2 || (z === Q$1 - GAMMA2 && r === 0) ? 0 : 1;
        // from FIPS204:
        // // const r1 = HighBits(r);
        // // const v1 = HighBits(r + z);
        // // const res1 = +(r1 !== v1);
        // But they return different results! However, decompose is same.
        // So, either there is a bug in Dilithium ref implementation or in FIPS204.
        // For now, lets use dilithium one, so test vectors can be passed.
        // The round-3 Dilithium / ML-DSA code uses the same low-bits / high-bits convention after
        // `r0 += ct0`.
        // See dilithium-py README section "Optimising decomposition and making hints".
        return res0;
    };
    const UseHint = (h, r) => {
        // Returns the high bits of r adjusted according to hint h
        const m = Math.floor((Q$1 - 1) / (2 * GAMMA2));
        const { r1, r0 } = decompose(r);
        // 3: if h = 1 and r0 > 0 return (r1 + 1) mod m
        // 4: if h = 1 and r0 ≤ 0 return (r1 − 1) mod m
        if (h === 1)
            return r0 > 0 ? crystals$1.mod(r1 + 1, m) | 0 : crystals$1.mod(r1 - 1, m) | 0;
        return r1 | 0;
    };
    const Power2Round = (r) => {
        // Decomposes r into (r1, r0) such that r ≡ r1*(2**d) + r0 mod q.
        const rPlus = crystals$1.mod(r);
        const r0 = crystals$1.smod(rPlus, 2 ** D) | 0;
        return { r1: Math.floor((rPlus - r0) / 2 ** D) | 0, r0 };
    };
    const hintCoder = {
        bytesLen: OMEGA + K,
        encode: (h_) => {
            const h = h_;
            if (h === false)
                throw new Error('hint.encode: hint is false'); // should never happen
            const res = new Uint8Array(OMEGA + K);
            for (let i = 0, k = 0; i < K; i++) {
                for (let j = 0; j < N$1; j++)
                    if (h[i][j] !== 0)
                        res[k++] = j;
                res[OMEGA + i] = k;
            }
            return res;
        },
        decode: (buf) => {
            const h = [];
            let k = 0;
            for (let i = 0; i < K; i++) {
                const hi = newPoly(N$1);
                if (buf[OMEGA + i] < k || buf[OMEGA + i] > OMEGA)
                    return false;
                for (let j = k; j < buf[OMEGA + i]; j++) {
                    if (j > k && buf[j] <= buf[j - 1])
                        return false;
                    hi[buf[j]] = 1;
                }
                k = buf[OMEGA + i];
                h.push(hi);
            }
            for (let j = k; j < OMEGA; j++)
                if (buf[j] !== 0)
                    return false;
            return h;
        },
    };
    const ETACoder = polyCoder$1(ETA === 2 ? 3 : 4, (i) => ETA - i, (i) => {
        if (!(-ETA <= i && i <= ETA))
            throw new Error(`malformed key s1/s3 ${i} outside of ETA range [${-ETA}, ${ETA}]`);
        return i;
    });
    const T0Coder = polyCoder$1(13, (i) => (1 << (D - 1)) - i);
    const T1Coder = polyCoder$1(10);
    // Requires smod. Need to fix!
    const ZCoder = polyCoder$1(GAMMA1 === 1 << 17 ? 18 : 20, (i) => crystals$1.smod(GAMMA1 - i));
    const W1Coder = polyCoder$1(GAMMA2 === GAMMA2_1 ? 6 : 4);
    const W1Vec = vecCoder(W1Coder, K);
    // Main structures
    const publicCoder = splitCoder('publicKey', 32, vecCoder(T1Coder, K));
    const secretCoder = splitCoder('secretKey', 32, 32, TR_BYTES, vecCoder(ETACoder, L), vecCoder(ETACoder, K), vecCoder(T0Coder, K));
    const sigCoder = splitCoder('signature', C_TILDE_BYTES, vecCoder(ZCoder, L), hintCoder);
    const CoefFromHalfByte = ETA === 2
        ? (n) => (n < 15 ? 2 - (n % 5) : false)
        : (n) => (n < 9 ? 4 - n : false);
    // Return poly in ordinary representation.
    // This helper returns ordinary-form `[-ETA, ETA]` coefficients for ExpandS; callers apply
    // `NTT.encode()` later when needed.
    function RejBoundedPoly(xof_) {
        const xof = xof_;
        // Samples an element a ∈ Rq with coeffcients in [−η, η] computed via rejection sampling from ρ.
        const r = newPoly(N$1);
        for (let j = 0; j < N$1;) {
            const b = xof();
            for (let i = 0; j < N$1 && i < b.length; i += 1) {
                // half byte. Should be superfast with vector instructions. But very slow with js :(
                const d1 = CoefFromHalfByte(b[i] & 0x0f);
                const d2 = CoefFromHalfByte((b[i] >> 4) & 0x0f);
                if (d1 !== false)
                    r[j++] = d1;
                if (j < N$1 && d2 !== false)
                    r[j++] = d2;
            }
        }
        return r;
    }
    const SampleInBall = (seed) => {
        // Samples a polynomial c ∈ Rq with coeffcients from {−1, 0, 1} and Hamming weight τ
        const pre = newPoly(N$1);
        const s = shake256.create({}).update(seed);
        const buf = new Uint8Array(shake256.blockLen);
        s.xofInto(buf);
        // FIPS 204 Algorithm 29 uses the first 8 squeezed bytes as the 64 sign bits `h`,
        // then rejection-samples coefficient positions from the remaining XOF stream.
        const masks = buf.slice(0, 8);
        for (let i = N$1 - TAU, pos = 8, maskPos = 0, maskBit = 0; i < N$1; i++) {
            let b = i + 1;
            for (; b > i;) {
                b = buf[pos++];
                if (pos < shake256.blockLen)
                    continue;
                s.xofInto(buf);
                pos = 0;
            }
            pre[i] = pre[b];
            pre[b] = 1 - (((masks[maskPos] >> maskBit++) & 1) << 1);
            if (maskBit >= 8) {
                maskPos++;
                maskBit = 0;
            }
        }
        return pre;
    };
    const polyPowerRound = (p_) => {
        const p = p_;
        const res0 = newPoly(N$1);
        const res1 = newPoly(N$1);
        for (let i = 0; i < p.length; i++) {
            const { r0, r1 } = Power2Round(p[i]);
            res0[i] = r0;
            res1[i] = r1;
        }
        return { r0: res0, r1: res1 };
    };
    const polyUseHint = (u_, h_) => {
        const u = u_;
        const h = h_;
        // In-place on `u`: verification only needs the recovered high bits, so reuse the
        // temporary `wApprox` buffer instead of allocating another polynomial.
        for (let i = 0; i < N$1; i++)
            u[i] = UseHint(h[i], u[i]);
        return u;
    };
    const polyMakeHint = (a_, b_) => {
        const a = a_;
        const b = b_;
        const v = newPoly(N$1);
        let cnt = 0;
        for (let i = 0; i < N$1; i++) {
            const h = MakeHint(a[i], b[i]);
            v[i] = h;
            cnt += h;
        }
        return { v, cnt };
    };
    const signRandBytes = 32;
    const seedCoder = splitCoder('seed', 32, 64, 32);
    // API & argument positions are exactly as in FIPS204.
    const internal = Object.freeze({
        info: Object.freeze({ type: 'internal-ml-dsa' }),
        lengths: Object.freeze({
            secretKey: secretCoder.bytesLen,
            publicKey: publicCoder.bytesLen,
            seed: 32,
            signature: sigCoder.bytesLen,
            signRand: signRandBytes,
        }),
        keygen: (seed) => {
            // H(𝜉||IntegerToBytes(𝑘, 1)||IntegerToBytes(ℓ, 1), 128) 2: ▷ expand seed
            const seedDst = new Uint8Array(32 + 2);
            const randSeed = seed === undefined;
            if (randSeed)
                seed = randomBytes$1(32);
            abytesDoc(seed, 32, 'seed');
            seedDst.set(seed);
            if (randSeed)
                cleanBytes(seed);
            seedDst[32] = K;
            seedDst[33] = L;
            const [rho, rhoPrime, K_] = seedCoder.decode(shake256(seedDst, { dkLen: seedCoder.bytesLen }));
            const xofPrime = XOF256(rhoPrime);
            const s1 = [];
            for (let i = 0; i < L; i++)
                s1.push(RejBoundedPoly(xofPrime.get(i & 0xff, (i >> 8) & 0xff)));
            const s2 = [];
            for (let i = L; i < L + K; i++)
                s2.push(RejBoundedPoly(xofPrime.get(i & 0xff, (i >> 8) & 0xff)));
            const s1Hat = s1.map((i) => crystals$1.NTT.encode(i.slice()));
            const t0 = [];
            const t1 = [];
            const xof = XOF128(rho);
            const t = newPoly(N$1);
            for (let i = 0; i < K; i++) {
                // t ← NTT−1(A*NTT(s1)) + s2
                cleanBytes(t); // don't-reallocate
                for (let j = 0; j < L; j++) {
                    const aij = RejNTTPoly(xof.get(j, i)); // super slow!
                    polyAdd$1(t, MultiplyNTTs$1(aij, s1Hat[j]));
                }
                crystals$1.NTT.decode(t);
                const { r0, r1 } = polyPowerRound(polyAdd$1(t, s2[i])); // (t1, t0) ← Power2Round(t, d)
                t0.push(r0);
                t1.push(r1);
            }
            const publicKey = publicCoder.encode([rho, t1]); // pk ← pkEncode(ρ, t1)
            const tr = shake256(publicKey, { dkLen: TR_BYTES }); // tr ← H(BytesToBits(pk), 512)
            // sk ← skEncode(ρ, K,tr, s1, s2, t0)
            const secretKey = secretCoder.encode([rho, K_, tr, s1, s2, t0]);
            xof.clean();
            xofPrime.clean();
            // STATS
            // Kyber512: { calls: 4, xofs: 12 }, Kyber768: { calls: 9, xofs: 27 },
            // Kyber1024: { calls: 16, xofs: 48 }
            // DSA44: { calls: 24, xofs: 24 }, DSA65: { calls: 41, xofs: 41 },
            // DSA87: { calls: 71, xofs: 71 }
            cleanBytes(rho, rhoPrime, K_, s1, s2, s1Hat, t, t0, t1, tr, seedDst);
            return {
                publicKey: publicKey,
                secretKey: secretKey,
            };
        },
        getPublicKey: (secretKey) => {
            // (ρ, K,tr, s1, s2, t0) ← skDecode(sk)
            const [rho, _K, _tr, s1, s2, _t0] = secretCoder.decode(secretKey);
            const xof = XOF128(rho);
            const s1Hat = s1.map((p) => crystals$1.NTT.encode(p.slice()));
            const t1 = [];
            const tmp = newPoly(N$1);
            for (let i = 0; i < K; i++) {
                tmp.fill(0);
                for (let j = 0; j < L; j++) {
                    const aij = RejNTTPoly(xof.get(j, i)); // A_ij in NTT
                    polyAdd$1(tmp, MultiplyNTTs$1(aij, s1Hat[j])); // += A_ij * s1_j
                }
                crystals$1.NTT.decode(tmp); // NTT⁻¹
                polyAdd$1(tmp, s2[i]); // t_i = A·s1 + s2
                const { r1 } = polyPowerRound(tmp); // r1 = t1, r0 ≈ t0
                t1.push(r1);
            }
            xof.clean();
            cleanBytes(tmp, s1Hat, _t0, s1, s2);
            return publicCoder.encode([rho, t1]);
        },
        // NOTE: random is optional.
        sign: (msg, secretKey, opts = {}) => {
            validateSigOpts(opts);
            validateInternalOpts(opts);
            let { extraEntropy: random, externalMu = false } = opts;
            // This part can be pre-cached per secretKey, but there is only minor performance improvement,
            // since we re-use a lot of variables to computation.
            // (ρ, K,tr, s1, s2, t0) ← skDecode(sk)
            const [rho, _K, tr, s1, s2, t0] = secretCoder.decode(secretKey);
            // Cache matrix to avoid re-compute later
            const A = []; // A ← ExpandA(ρ)
            const xof = XOF128(rho);
            for (let i = 0; i < K; i++) {
                const pv = [];
                for (let j = 0; j < L; j++)
                    pv.push(RejNTTPoly(xof.get(j, i)));
                A.push(pv);
            }
            xof.clean();
            for (let i = 0; i < L; i++)
                crystals$1.NTT.encode(s1[i]); // sˆ1 ← NTT(s1)
            for (let i = 0; i < K; i++) {
                crystals$1.NTT.encode(s2[i]); // sˆ2 ← NTT(s2)
                crystals$1.NTT.encode(t0[i]); // tˆ0 ← NTT(t0)
            }
            // This part is per msg
            const mu = externalMu
                ? msg
                : // 6: µ ← H(tr||M, 512)
                    //    ▷ Compute message representative µ
                    shake256.create({ dkLen: CRH_BYTES }).update(tr).update(msg).digest();
            // Compute private random seed
            const rnd = random === false
                ? new Uint8Array(32)
                : random === undefined
                    ? randomBytes$1(signRandBytes)
                    : random;
            abytesDoc(rnd, 32, 'extraEntropy');
            const rhoprime = shake256
                .create({ dkLen: CRH_BYTES })
                .update(_K)
                .update(rnd)
                .update(mu)
                .digest(); // ρ′← H(K||rnd||µ, 512)
            abytesDoc(rhoprime, CRH_BYTES);
            const x256 = XOF256(rhoprime, ZCoder.bytesLen);
            //  Rejection sampling loop
            main_loop: for (let kappa = 0;;) {
                const y = [];
                // y ← ExpandMask(ρ , κ)
                for (let i = 0; i < L; i++, kappa++)
                    y.push(ZCoder.decode(x256.get(kappa & 0xff, kappa >> 8)()));
                const z = y.map((i) => crystals$1.NTT.encode(i.slice()));
                const w = [];
                for (let i = 0; i < K; i++) {
                    // w ← NTT−1(A ◦ NTT(y))
                    const wi = newPoly(N$1);
                    for (let j = 0; j < L; j++)
                        polyAdd$1(wi, MultiplyNTTs$1(A[i][j], z[j]));
                    crystals$1.NTT.decode(wi);
                    w.push(wi);
                }
                const w1 = w.map((j) => j.map(HighBits)); // w1 ← HighBits(w)
                // Commitment hash: c˜ ∈{0, 1 2λ } ← H(µ||w1Encode(w1), 2λ)
                const cTilde = shake256
                    .create({ dkLen: C_TILDE_BYTES })
                    .update(mu)
                    .update(W1Vec.encode(w1))
                    .digest();
                // Verifer’s challenge
                // c ← SampleInBall(c˜1); cˆ ← NTT(c)
                const cHat = crystals$1.NTT.encode(SampleInBall(cTilde));
                // ⟨⟨cs1⟩⟩ ← NTT−1(cˆ◦ sˆ1)
                const cs1 = s1.map((i) => MultiplyNTTs$1(i, cHat));
                for (let i = 0; i < L; i++) {
                    polyAdd$1(crystals$1.NTT.decode(cs1[i]), y[i]); // z ← y + ⟨⟨cs1⟩⟩
                    if (polyChknorm(cs1[i], GAMMA1 - BETA))
                        continue main_loop; // ||z||∞ ≥ γ1 − β
                }
                // cs1 is now z (▷ Signer’s response)
                let cnt = 0;
                const h = [];
                for (let i = 0; i < K; i++) {
                    const cs2 = crystals$1.NTT.decode(MultiplyNTTs$1(s2[i], cHat)); // ⟨⟨cs2⟩⟩ ← NTT−1(cˆ◦ sˆ2)
                    const r0 = polySub$1(w[i], cs2).map(LowBits); // r0 ← LowBits(w − ⟨⟨cs2⟩⟩)
                    if (polyChknorm(r0, GAMMA2 - BETA))
                        continue main_loop; // ||r0||∞ ≥ γ2 − β
                    const ct0 = crystals$1.NTT.decode(MultiplyNTTs$1(t0[i], cHat)); // ⟨⟨ct0⟩⟩ ← NTT−1(cˆ◦ tˆ0)
                    if (polyChknorm(ct0, GAMMA2))
                        continue main_loop;
                    polyAdd$1(r0, ct0);
                    // ▷ Signer’s hint
                    const hint = polyMakeHint(r0, w1[i]); // h ← MakeHint(−⟨⟨ct0⟩⟩, w− ⟨⟨cs2⟩⟩ + ⟨⟨ct0⟩⟩)
                    h.push(hint.v);
                    cnt += hint.cnt;
                }
                if (cnt > OMEGA)
                    continue; // the number of 1’s in h is greater than ω
                x256.clean();
                const res = sigCoder.encode([cTilde, cs1, h]); // σ ← sigEncode(c˜, z mod±q, h)
                // rho, _K, tr is subarray of secretKey, cannot clean.
                cleanBytes(cTilde, cs1, h, cHat, w1, w, z, y, rhoprime, s1, s2, t0, ...A);
                // `externalMu` hands ownership of `mu` to the caller,
                // so only wipe the internally derived digest form here;
                // zeroizing caller memory would break the caller's own reuse / verify path.
                if (!externalMu)
                    cleanBytes(mu);
                return res;
            }
            // @ts-ignore
            throw new Error('Unreachable code path reached, report this error');
        },
        verify: (sig, msg, publicKey, opts = {}) => {
            validateInternalOpts(opts);
            const { externalMu = false } = opts;
            // ML-DSA.Verify(pk, M, σ): Verifes a signature σ for a message M.
            const [rho, t1] = publicCoder.decode(publicKey); // (ρ, t1) ← pkDecode(pk)
            const tr = shake256(publicKey, { dkLen: TR_BYTES }); // 6: tr ← H(BytesToBits(pk), 512)
            if (sig.length !== sigCoder.bytesLen)
                return false; // return false instead of exception
            // (c˜, z, h) ← sigDecode(σ)
            // ▷ Signer’s commitment hash c ˜, response z and hint
            const [cTilde, z, h] = sigCoder.decode(sig);
            if (h === false)
                return false; // if h = ⊥ then return false
            for (let i = 0; i < L; i++)
                if (polyChknorm(z[i], GAMMA1 - BETA))
                    return false;
            const mu = externalMu
                ? msg
                : // 7: µ ← H(tr||M, 512)
                    shake256.create({ dkLen: CRH_BYTES }).update(tr).update(msg).digest();
            // Compute verifer’s challenge from c˜
            const c = crystals$1.NTT.encode(SampleInBall(cTilde)); // c ← SampleInBall(c˜1)
            const zNtt = z.map((i) => i.slice()); // zNtt = NTT(z)
            for (let i = 0; i < L; i++)
                crystals$1.NTT.encode(zNtt[i]);
            const wTick1 = [];
            const xof = XOF128(rho);
            for (let i = 0; i < K; i++) {
                const ct12d = MultiplyNTTs$1(crystals$1.NTT.encode(polyShiftl(t1[i])), c); //c * t1 * (2**d)
                const Az = newPoly(N$1); // // A * z
                for (let j = 0; j < L; j++) {
                    const aij = RejNTTPoly(xof.get(j, i)); // A[i][j] inplace
                    polyAdd$1(Az, MultiplyNTTs$1(aij, zNtt[j]));
                }
                // wApprox = A*z - c*t1 * (2**d)
                const wApprox = crystals$1.NTT.decode(polySub$1(Az, ct12d));
                // Reconstruction of signer’s commitment
                wTick1.push(polyUseHint(wApprox, h[i])); // w ′ ← UseHint(h, w'approx )
            }
            xof.clean();
            // c˜′← H (µ||w1Encode(w′1), 2λ),  Hash it; this should match c˜
            const c2 = shake256
                .create({ dkLen: C_TILDE_BYTES })
                .update(mu)
                .update(W1Vec.encode(wTick1))
                .digest();
            // Additional checks in FIPS-204:
            // [[ ||z||∞ < γ1 − β ]] and [[c ˜ = c˜′]] and [[number of 1’s in h is ≤ ω]]
            for (const t of h) {
                const sum = t.reduce((acc, i) => acc + i, 0);
                if (!(sum <= OMEGA))
                    return false;
            }
            for (const t of z)
                if (polyChknorm(t, GAMMA1 - BETA))
                    return false;
            return equalBytes$1(cTilde, c2);
        },
    });
    return Object.freeze({
        info: Object.freeze({ type: 'ml-dsa' }),
        internal,
        securityLevel: securityLevel,
        keygen: internal.keygen,
        lengths: internal.lengths,
        getPublicKey: internal.getPublicKey,
        sign: (msg, secretKey, opts = {}) => {
            validateSigOpts(opts);
            const M = getMessage(msg, opts.context);
            const res = internal.sign(M, secretKey, opts);
            cleanBytes(M);
            return res;
        },
        verify: (sig, msg, publicKey, opts = {}) => {
            validateVerOpts(opts);
            return internal.verify(sig, getMessage(msg, opts.context), publicKey);
        },
        prehash: (hash) => {
            checkHash(hash, securityLevel);
            return Object.freeze({
                info: Object.freeze({ type: 'hashml-dsa' }),
                securityLevel: securityLevel,
                lengths: internal.lengths,
                keygen: internal.keygen,
                getPublicKey: internal.getPublicKey,
                sign: (msg, secretKey, opts = {}) => {
                    validateSigOpts(opts);
                    const M = getMessagePrehash(hash, msg, opts.context);
                    const res = internal.sign(M, secretKey, opts);
                    cleanBytes(M);
                    return res;
                },
                verify: (sig, msg, publicKey, opts = {}) => {
                    validateVerOpts(opts);
                    return internal.verify(sig, getMessagePrehash(hash, msg, opts.context), publicKey);
                },
            });
        },
    });
}
/** ML-DSA-44 for 128-bit security level. Not recommended after 2030, as per ASD. */
const ml_dsa44 = /* @__PURE__ */ (() => getDilithium({
    ...PARAMS$2[2],
    CRH_BYTES: 64,
    TR_BYTES: 64,
    C_TILDE_BYTES: 32,
    XOF128,
    XOF256,
    securityLevel: 128,
}))();
/** ML-DSA-65 for 192-bit security level. Not recommended after 2030, as per ASD. */
const ml_dsa65 = /* @__PURE__ */ (() => getDilithium({
    ...PARAMS$2[3],
    CRH_BYTES: 64,
    TR_BYTES: 64,
    C_TILDE_BYTES: 48,
    XOF128,
    XOF256,
    securityLevel: 192,
}))();
/** ML-DSA-87 for 256-bit security level. OK after 2030, as per ASD. */
const ml_dsa87 = /* @__PURE__ */ (() => getDilithium({
    ...PARAMS$2[5],
    CRH_BYTES: 64,
    TR_BYTES: 64,
    C_TILDE_BYTES: 64,
    XOF128,
    XOF256,
    securityLevel: 256,
}))();

/**
 * ML-KEM: Module Lattice-based Key Encapsulation Mechanism from
 * [FIPS-203](https://csrc.nist.gov/pubs/fips/203/ipd). A.k.a. CRYSTALS-Kyber.
 *
 * Key encapsulation is similar to DH / ECDH (think X25519), with important differences:
 * * Unlike in ECDH, we can't verify if it was "Bob" who've sent the shared secret
 * * Unlike ECDH, it is probabalistic and relies on quality of randomness (CSPRNG).
 * * Decapsulation never throws an error, even when shared secret was
 *   encrypted by a different public key. It will just return a different shared secret.
 *
 * There are some concerns with regards to security: see
 * [djb blog](https://blog.cr.yp.to/20231003-countcorrectly.html) and
 * [mailing list](https://groups.google.com/a/list.nist.gov/g/pqc-forum/c/W2VOzy0wz_E).
 *
 * Has similar internals to ML-DSA, but their keys and params are different.
 *
 * Check out [official site](https://www.pq-crystals.org/kyber/resources.shtml),
 * [repo](https://github.com/pq-crystals/kyber),
 * [spec](https://datatracker.ietf.org/doc/draft-cfrg-schwabe-kyber/).
 * @module
 */
/*! noble-post-quantum - MIT License (c) 2024 Paul Miller (paulmillr.com) */
/** Key encapsulation mechanism interface */
const N = 256; // Kyber (not FIPS-203) supports different lengths, but all std modes were using 256
const Q = 3329; // 13*(2**8)+1, modulo prime
const F = 3303; // 3303 ≡ 128**(−1) mod q (FIPS-203)
const ROOT_OF_UNITY = 17; // ζ = 17 ∈ Zq is a primitive 256-th root of unity modulo Q. ζ**128 ≡−1
// treeshake: keep genCrystals behind the object so PARAMS-only bundles can drop it entirely.
// Shared CRYSTALS helper in the ML-KEM branch: Kyber mode, 7-bit bit-reversal,
// and Uint16Array polys because current coefficients stay reduced modulo q.
const crystals = /* @__PURE__ */ genCrystals({
    N,
    Q,
    F,
    ROOT_OF_UNITY,
    newPoly: (n) => new Uint16Array(n),
    brvBits: 7,
    isKyber: true,
});
/** Internal params of ML-KEM versions */
// prettier-ignore
/** Built-in ML-KEM parameter presets keyed by the public export names
 * `ml_kem512` / `ml_kem768` / `ml_kem1024`.
 * `RBGstrength` is Table 2's required randomness-source strength in bits,
 * not a generic security label.
 */
const PARAMS$1 = /* @__PURE__ */ (() => Object.freeze({
    512: Object.freeze({ N, Q, K: 2, ETA1: 3, ETA2: 2, du: 10, dv: 4, RBGstrength: 128 }),
    768: Object.freeze({ N, Q, K: 3, ETA1: 2, ETA2: 2, du: 10, dv: 4, RBGstrength: 192 }),
    1024: Object.freeze({ N, Q, K: 4, ETA1: 2, ETA2: 2, du: 11, dv: 5, RBGstrength: 256 }),
}))();
// FIPS-203: compress/decompress
const compress = (d) => {
    // d=12 is the ByteEncode12/ByteDecode12 path, not lossy compression.
    // ByteDecode12 interprets each 12-bit word modulo q; without that reduction the public-key
    // modulus check in encapsulate() becomes a no-op for malformed coefficients like 4095.
    if (d >= 12)
        return { encode: (i) => i, decode: (i) => (i >= Q ? i - Q : i) };
    // Comments map to python implementation in RFC (draft-cfrg-schwabe-kyber)
    // const round = (i: number) => Math.floor(i + 0.5) | 0;
    const a = 2 ** (d - 1);
    return {
        // This only matches standalone Compress_d after bitsCoder masks the result into Z_(2^d).
        encode: (i) => ((i << d) + Q / 2) / Q,
        // const decompress = (i: number) => round((Q / 2 ** d) * i);
        decode: (i) => (i * Q + a) >>> d,
    };
};
// Raw ByteEncode_d / ByteDecode_d from FIPS 203 operate on d-bit words directly.
// That differs from `polyCoder(d)` for d<12, where noble folds packing together with the lossy
// ciphertext compression step used by u/v. Tests that exercise the spec's raw packing surface need
// this exact non-lossy variant instead.
const byteCoder = (d) => crystals.bitsCoder(d, { encode: (i) => i, decode: (i) => (i >= Q ? i - Q : i) }
    );
// NOTE: we merge encoding and compress because it is faster, also both require same d param
// d=12 is the ByteEncode12/ByteDecode12 path rather than compression, and caller-side
// public-key modulus checks route through this helper's decode/encode roundtrip.
// Converts between bytes and d-bits compressed representation.
// Kinda like convertRadix2 from @scure/base.
// decode(encode(t)) == t, but there is loss of information on encode(decode(t))
const polyCoder = (d) => (d === 12 ? byteCoder(12) : crystals.bitsCoder(d, compress(d)));
function polyAdd(a_, b_) {
    const a = a_;
    const b = b_;
    // Mutates `a` in place; callers must pass two N=256 polynomials.
    for (let i = 0; i < N; i++)
        a[i] = crystals.mod(a[i] + b[i]); // a += b
}
function polySub(a_, b_) {
    const a = a_;
    const b = b_;
    // Mutates `a` in place; callers must pass two N=256 polynomials.
    for (let i = 0; i < N; i++)
        a[i] = crystals.mod(a[i] - b[i]); // a -= b
}
// FIPS-203: Computes the product of two degree-one polynomials with respect to a quadratic modulus
function BaseCaseMultiply(a0, a1, b0, b1, zeta) {
    // `zeta` here is Algorithm 11's γ = ζ^(2BitRev_7(i)+1).
    const c0 = crystals.mod(a1 * b1 * zeta + a0 * b0);
    const c1 = crystals.mod(a0 * b1 + a1 * b0);
    return { c0, c1 };
}
// FIPS-203: Computes the product (in the ring Tq) of two NTT representations.
// Works in place on `f`; `g` is read-only and both inputs must already be in NTT form.
function MultiplyNTTs(f_, g_) {
    const f = f_;
    const g = g_;
    for (let i = 0; i < N / 2; i++) {
        let z = crystals.nttZetas[64 + (i >> 1)];
        if (i & 1)
            z = -z;
        const { c0, c1 } = BaseCaseMultiply(f[2 * i + 0], f[2 * i + 1], g[2 * i + 0], g[2 * i + 1], z);
        f[2 * i + 0] = c0;
        f[2 * i + 1] = c1;
    }
    return f;
}
// Return poly in NTT representation
function SampleNTT(xof_) {
    const xof = xof_;
    // The reader must already bind the Algorithm 7 seed||j||i bytes
    // and return block lengths divisible by 3.
    const r = new Uint16Array(N);
    for (let j = 0; j < N;) {
        const b = xof();
        if (b.length % 3)
            throw new Error('SampleNTT: unaligned block');
        for (let i = 0; j < N && i + 3 <= b.length; i += 3) {
            const d1 = ((b[i + 0] >> 0) | (b[i + 1] << 8)) & 0xfff;
            const d2 = ((b[i + 1] >> 4) | (b[i + 2] << 4)) & 0xfff;
            if (d1 < Q)
                r[j++] = d1;
            if (j < N && d2 < Q)
                r[j++] = d2;
        }
    }
    return r;
}
// Sampling from the centered binomial distribution
// Returns poly with small coefficients (noise/errors) stored modulo q in ordinary coefficient form.
// Current callers only use Table 2 eta values {2,3} and PRF outputs of exactly 64*eta bytes.
const sampleCBDBytes = (buf, eta) => {
    const r = new Uint16Array(N);
    // CBD consumes the PRF bitstream in little-endian byte order; normalize the word view on BE,
    // then swap it back so callers still observe `buf` as read-only.
    const b32 = u32$1(buf);
    swap32IfBE$1(b32);
    let len = 0;
    for (let i = 0, p = 0, bb = 0, t0 = 0; i < b32.length; i++) {
        let b = b32[i];
        for (let j = 0; j < 32; j++) {
            bb += b & 1;
            b >>= 1;
            len += 1;
            if (len === eta) {
                t0 = bb;
                bb = 0;
            }
            else if (len === 2 * eta) {
                r[p++] = crystals.mod(t0 - bb);
                bb = 0;
                len = 0;
            }
        }
    }
    swap32IfBE$1(b32);
    if (len)
        throw new Error(`sampleCBD: leftover bits: ${len}`);
    return r;
};
function sampleCBD(PRF_, seed, nonce, eta) {
    const PRF = PRF_;
    return sampleCBDBytes(PRF((eta * N) / 4, seed, nonce), eta);
}
// K-PKE
// Internal ML-KEM subroutine only: exact 32-byte `seed` / `msg` inputs
// come from Algorithms 13-15, and the helper mutates decoded temporary
// polynomials in place while leaving caller byte arrays unchanged.
const genKPKE = (opts_) => {
    const opts = opts_;
    const { K, PRF, XOF, HASH512, ETA1, ETA2, du, dv } = opts;
    const poly1 = polyCoder(1);
    const polyV = polyCoder(dv);
    const polyU = polyCoder(du);
    const publicCoder = splitCoder('publicKey', vecCoder(polyCoder(12), K), 32);
    const secretCoder = vecCoder(polyCoder(12), K);
    const cipherCoder = splitCoder('ciphertext', vecCoder(polyU, K), polyV);
    const seedCoder = splitCoder('seed', 32, 32);
    return {
        secretCoder,
        lengths: {
            secretKey: secretCoder.bytesLen,
            publicKey: publicCoder.bytesLen,
            cipherText: cipherCoder.bytesLen,
        },
        keygen: (seed) => {
            abytesDoc(seed, 32, 'seed');
            const seedDst = new Uint8Array(33);
            seedDst.set(seed);
            // FIPS 203 Algorithm 13 appends the parameter-set byte `k`
            // before `G(d || k)`, so expanding the same 32-byte seed
            // under a different ML-KEM parameter set yields unrelated keys.
            seedDst[32] = K;
            const seedHash = HASH512(seedDst);
            const [rho, sigma] = seedCoder.decode(seedHash);
            const sHat = [];
            const tHat = [];
            for (let i = 0; i < K; i++)
                sHat.push(crystals.NTT.encode(sampleCBD(PRF, sigma, i, ETA1)));
            const x = XOF(rho);
            for (let i = 0; i < K; i++) {
                const e = crystals.NTT.encode(sampleCBD(PRF, sigma, K + i, ETA1));
                for (let j = 0; j < K; j++) {
                    const aji = SampleNTT(x.get(j, i)); // A[i][j], inplace
                    polyAdd(e, MultiplyNTTs(aji, sHat[j]));
                }
                tHat.push(e); // t ← A ◦ s + e
            }
            x.clean();
            const res = {
                publicKey: publicCoder.encode([tHat, rho]),
                secretKey: secretCoder.encode(sHat),
            };
            cleanBytes(rho, sigma, sHat, tHat, seedDst, seedHash);
            return res;
        },
        encrypt: (publicKey, msg, seed) => {
            const [tHat, rho] = publicCoder.decode(publicKey);
            const rHat = [];
            for (let i = 0; i < K; i++)
                rHat.push(crystals.NTT.encode(sampleCBD(PRF, seed, i, ETA1)));
            const x = XOF(rho);
            const tmp2 = new Uint16Array(N);
            const u = [];
            for (let i = 0; i < K; i++) {
                const e1 = sampleCBD(PRF, seed, K + i, ETA2);
                const tmp = new Uint16Array(N);
                for (let j = 0; j < K; j++) {
                    const aij = SampleNTT(x.get(i, j)); // A[j][i], inplace transpose access
                    polyAdd(tmp, MultiplyNTTs(aij, rHat[j])); // t += aij * rHat[j]
                }
                polyAdd(e1, crystals.NTT.decode(tmp)); // e1 += tmp
                u.push(e1);
                polyAdd(tmp2, MultiplyNTTs(tHat[i], rHat[i])); // t2 += tHat[i] * rHat[i]
                cleanBytes(tmp);
            }
            x.clean();
            const e2 = sampleCBD(PRF, seed, 2 * K, ETA2);
            polyAdd(e2, crystals.NTT.decode(tmp2)); // e2 += tmp2
            const v = poly1.decode(msg); // encode plaintext m into polynomial v
            polyAdd(v, e2); // v += e2
            cleanBytes(tHat, rHat, tmp2, e2);
            return cipherCoder.encode([u, v]);
        },
        decrypt: (cipherText, privateKey) => {
            const [u, v] = cipherCoder.decode(cipherText);
            const sk = secretCoder.decode(privateKey); // s  ← ByteDecode_12(dkPKE)
            const tmp = new Uint16Array(N);
            // tmp += sk[i] * u[i]
            for (let i = 0; i < K; i++)
                polyAdd(tmp, MultiplyNTTs(sk[i], crystals.NTT.encode(u[i])));
            polySub(v, crystals.NTT.decode(tmp)); // w = v' - tmp
            cleanBytes(tmp, sk, u);
            return poly1.encode(v);
        },
    };
};
/**
 * Public ML-KEM wrapper over the internal K-PKE subroutine.
 * `keygen(seed)` and `encapsulate(publicKey, msg)` are deterministic/test-oriented hooks that map
 * more directly to Algorithms 16-17 than to the pure no-input / random-internal Algorithms 19-20.
 * decapsulate() tries to follow the Algorithms 18/21 implicit-reject structure as closely as
 * practical here by re-encrypting, comparing ciphertexts, returning `Khat` on match or `Kbar` on
 * mismatch, and zeroizing the non-returned shared-secret candidate; JS/JIT still provides no
 * constant-time guarantees for that path.
 */
function createKyber(opts) {
    const rawOpts = opts;
    const KPKE = genKPKE(rawOpts);
    const { HASH256, HASH512, KDF } = rawOpts;
    const { secretCoder: KPKESecretCoder, lengths } = KPKE;
    const secretCoder = splitCoder('secretKey', lengths.secretKey, lengths.publicKey, 32, 32);
    const msgLen = 32;
    const seedLen = 64;
    const kemLengths = Object.freeze({
        ...lengths,
        seed: 64,
        msg: msgLen,
        msgRand: msgLen,
        secretKey: secretCoder.bytesLen,
    });
    return Object.freeze({
        info: Object.freeze({ type: 'ml-kem' }),
        lengths: kemLengths,
        keygen: (seed = randomBytes$1(seedLen)) => {
            abytesDoc(seed, seedLen, 'seed');
            const { publicKey, secretKey: sk } = KPKE.keygen(seed.subarray(0, 32));
            const publicKeyHash = HASH256(publicKey);
            // (dkPKE||ek||H(ek)||z)
            const secretKey = secretCoder.encode([sk, publicKey, publicKeyHash, seed.subarray(32)]);
            cleanBytes(sk, publicKeyHash);
            return {
                publicKey: publicKey,
                secretKey: secretKey,
            };
        },
        getPublicKey: (secretKey) => {
            const [_sk, publicKey, _publicKeyHash, _z] = secretCoder.decode(secretKey);
            return Uint8Array.from(publicKey);
        },
        encapsulate: (publicKey, msg = randomBytes$1(msgLen)) => {
            abytesDoc(publicKey, lengths.publicKey, 'publicKey');
            abytesDoc(msg, msgLen, 'message');
            // FIPS-203 includes additional verification check for modulus
            const eke = publicKey.subarray(0, 384 * opts.K);
            // Copy because of inplace encoding
            const ek = KPKESecretCoder.encode(KPKESecretCoder.decode(copyBytes$1(eke)));
            // (Modulus check.) Perform the computation ek ← ByteEncode12(ByteDecode12(eke)).
            // If ek = ̸ eke, the input is invalid. (See Section 4.2.1.)
            if (!equalBytes$1(ek, eke)) {
                cleanBytes(ek);
                throw new Error('ML-KEM.encapsulate: wrong publicKey modulus');
            }
            cleanBytes(ek);
            // derive randomness
            const kr = HASH512.create().update(msg).update(HASH256(publicKey)).digest();
            const cipherText = KPKE.encrypt(publicKey, msg, kr.subarray(32, 64));
            cleanBytes(kr.subarray(32));
            return {
                cipherText: cipherText,
                sharedSecret: kr.subarray(0, 32),
            };
        },
        decapsulate: (cipherText, secretKey) => {
            abytesDoc(secretKey, secretCoder.bytesLen, 'secretKey'); // 768*k + 96
            abytesDoc(cipherText, lengths.cipherText, 'cipherText'); // 32(du*k + dv)
            // test ← H(dk[384𝑘 ∶ 768𝑘 + 32])) .
            const k768 = secretCoder.bytesLen - 96;
            const start = k768 + 32;
            const test = HASH256(secretKey.subarray(k768 / 2, start));
            // If test ≠ dk[768𝑘 + 32 ∶ 768𝑘 + 64], then input checking has failed.
            if (!equalBytes$1(test, secretKey.subarray(start, start + 32)))
                throw new Error('invalid secretKey: hash check failed');
            const [sk, publicKey, publicKeyHash, z] = secretCoder.decode(secretKey);
            const msg = KPKE.decrypt(cipherText, sk);
            // derive randomness, Khat, rHat = G(mHat || h)
            const kr = HASH512.create().update(msg).update(publicKeyHash).digest();
            const Khat = kr.subarray(0, 32);
            // re-encrypt using the derived randomness
            const cipherText2 = KPKE.encrypt(publicKey, msg, kr.subarray(32, 64));
            // if ciphertexts do not match, “implicitly reject”
            const isValid = equalBytes$1(cipherText, cipherText2);
            const Kbar = KDF.create({ dkLen: 32 }).update(z).update(cipherText).digest();
            cleanBytes(msg, cipherText2, !isValid ? Khat : Kbar);
            return (isValid ? Khat : Kbar);
        },
    });
}
// FIPS 203's PRF_eta binding: current callers use only 32-byte keys, one-byte nonces,
// and dkLen values {128, 192}; out-of-range nonce numbers still wrap modulo 256 here.
function shakePRF(dkLen, key, nonce) {
    return shake256
        .create({ dkLen })
        .update(key)
        .update(new Uint8Array([nonce]))
        .digest();
}
// Fixed ML-KEM hash/XOF bindings. `KDF` here is the spec's fixed 32-byte `J` call,
// and swapping any field changes the scheme rather than tuning an internal dependency.
const opts = /* @__PURE__ */ (() => ({
    HASH256: sha3_256,
    HASH512: sha3_512,
    KDF: shake256,
    XOF: XOF128,
    PRF: shakePRF,
}))();
// Parameter-set instantiation step for the spec's "ML-KEM-x" names; current correctness relies
// on the internal PARAMS rows rather than local validation of arbitrary KEMParam objects.
const mk = (params) => createKyber({
    ...opts,
    ...params,
});
/**
 * ML-KEM-512: Table 2 row `k=2, η1=3, η2=2, du=10, dv=4`; Table 3 sizes `800/1632/768/32`.
 * The ASD lifecycle note here is external policy guidance, not a FIPS 203 requirement.
 */
const ml_kem512 = /* @__PURE__ */ (() => mk(PARAMS$1[512]))();
/**
 * ML-KEM-768: Table 2 row `k=3, η1=2, η2=2, du=10, dv=4`; Table 3 sizes `1184/2400/1088/32`.
 * The ASD lifecycle note here is external policy guidance, not a FIPS 203 requirement.
 */
const ml_kem768 = /* @__PURE__ */ (() => mk(PARAMS$1[768]))();
/**
 * ML-KEM-1024: Table 2 row `k=4, η1=2, η2=2, du=11, dv=5`; Table 3 sizes `1568/3168/1568/32`.
 * The ASD lifecycle note here is external policy guidance, not a FIPS 203 requirement.
 */
const ml_kem1024 = /* @__PURE__ */ (() => mk(PARAMS$1[1024]))();

/**
 * SLH-DSA: StateLess Hash-based Digital Signature Standard from
 * [FIPS-205](https://csrc.nist.gov/pubs/fips/205/ipd). A.k.a. Sphincs+ v3.1.
 *
 * There are many different kinds of SLH, but basically `sha2` / `shake` indicate internal hash,
 * `128` / `192` / `256` indicate security level, and `s` /`f` indicate trade-off (Small / Fast).
 *
 * Hashes function similarly to signatures. You hash a private key to get a public key,
 * which can be used to verify the private key. However, this only works once since
 * disclosing the pre-image invalidates the key.
 *
 * To address the "one-time" limitation, we can use a Merkle tree root hash:
 * h(h(h(0) || h(1)) || h(h(2) || h(3))))
 *
 * This allows us to have the same public key output from the hash, but disclosing one
 * path in the tree doesn't invalidate the others. By choosing a path related to the
 * message, we can "sign" it.
 *
 * Limitation: Only a fixed number of signatures can be made. For instance, a Merkle tree
 * with depth 8 allows 256 distinct messages. Using different trees for each node can
 * prevent forgeries, but the key will still degrade over time.
 *
 * WOTS: One-time signatures (can be forged if same key used twice).
 * FORS: Forest of Random Subsets
 *
 * Check out [official site](https://sphincs.org) & [repo](https://github.com/sphincs/sphincsplus).
 * @module
 */
/*! noble-post-quantum - MIT License (c) 2024 Paul Miller (paulmillr.com) */
/** Winternitz signature params. */
/**
 * Built-in SLH-DSA Table 2 subset keyed by strength/profile.
 * SHA2 and SHAKE pairs share the same numeric rows here, so the hash family is chosen separately.
 * `securityLevel` stores 128/192/256-bit strengths for `checkHash(...)`,
 * not Table 2's category labels 1/3/5.
 * Other Table 2 columns such as `m`, public-key bytes, and signature bytes
 * stay derived at the export layer.
 */
const PARAMS = /* @__PURE__ */ (() => Object.freeze({
    '128f': Object.freeze({ W: 16, N: 16, H: 66, D: 22, K: 33, A: 6, securityLevel: 128 }),
    '128s': Object.freeze({ W: 16, N: 16, H: 63, D: 7, K: 14, A: 12, securityLevel: 128 }),
    '192f': Object.freeze({ W: 16, N: 24, H: 66, D: 22, K: 33, A: 8, securityLevel: 192 }),
    '192s': Object.freeze({ W: 16, N: 24, H: 63, D: 7, K: 17, A: 14, securityLevel: 192 }),
    '256f': Object.freeze({ W: 16, N: 32, H: 68, D: 17, K: 35, A: 9, securityLevel: 256 }),
    '256s': Object.freeze({ W: 16, N: 32, H: 64, D: 8, K: 22, A: 14, securityLevel: 256 }),
}))();
// FIPS 205 `ADRS.setTypeAndClear(...)` selectors. Local names shorten the spec labels
// (`WOTS_HASH` -> `WOTS`, `TREE` -> `HASHTREE`, `FORS_ROOTS` -> `FORSPK`), and `setAddr({ type })`
// below only writes the type word; callers still need to preserve or overwrite the trailing words.
const AddressType = {
    WOTS: 0,
    WOTSPK: 1,
    HASHTREE: 2,
    FORSTREE: 3,
    FORSPK: 4,
    WOTSPRF: 5,
    FORSPRF: 6,
};
function hexToNumber(hex) {
    if (typeof hex !== 'string')
        throw new Error('hex string expected, got ' + typeof hex);
    return BigInt(hex === '' ? '0' : '0x' + hex); // Big Endian
}
// BE: Big Endian, LE: Little Endian. This is the local FIPS 205 `toInt(...)` equivalent.
function bytesToNumberBE(bytes) {
    return hexToNumber(bytesToHex$1(bytes));
}
// Local in-range FIPS 205 `toByte(x, n)` equivalent; callers must keep `n < 256^len`.
function numberToBytesBE(n, len) {
    return hexToBytes$1(n.toString(16).padStart(len * 2, '0'));
}
// Local FIPS 205 Algorithm 4 `base_2^b(...)` implementation. Bits are consumed in big-endian
// order within each input byte, and callers must provide at least `ceil(outLen * b / 8)` bytes;
// short inputs are not rejected and would zero-extend implicitly.
const base2b = (outLen, b) => {
    const mask = getMask(b);
    return (bytes) => {
        const baseB = new Uint32Array(outLen);
        for (let out = 0, pos = 0, bits = 0, total = 0; out < outLen; out++) {
            while (bits < b) {
                total = (total << 8) | bytes[pos++];
                bits += 8;
            }
            bits -= b;
            baseB[out] = (total >>> bits) & mask;
        }
        return baseB;
    };
};
function getMaskBig(bits) {
    return (1n << BigInt(bits)) - 1n; // 4 -> 0b1111
}
/** One parameter/hash instantiation of the public SLH-DSA API.
 * `keygen(seed)` is a deterministic 3N-byte library hook around the internal keygen flow,
 * and `getPublicKey(secretKey)` only extracts the embedded public key
 * instead of recomputing `PK.root`.
 */
function gen(opts, hashOpts_) {
    const hashOpts = hashOpts_;
    const { N, W, H, D, K, A, securityLevel: securityLevel } = opts;
    const getContext = hashOpts.getContext(opts);
    if (W !== 16)
        throw new Error('Unsupported Winternitz parameter');
    const WOTS_LOGW = 4;
    const WOTS_LEN1 = Math.floor((8 * N) / WOTS_LOGW);
    const WOTS_LEN2 = N <= 8 ? 2 : N <= 136 ? 3 : 4;
    const TREE_HEIGHT = Math.floor(H / D);
    const WOTS_LEN = WOTS_LEN1 + WOTS_LEN2;
    let ADDR_BYTES = 22;
    let OFFSET_LAYER = 0;
    let OFFSET_TREE = 1;
    let OFFSET_TYPE = 9;
    let OFFSET_KP_ADDR2 = 12;
    let OFFSET_KP_ADDR1 = 13;
    let OFFSET_CHAIN_ADDR = 17;
    let OFFSET_TREE_INDEX = 18;
    let OFFSET_HASH_ADDR = 21;
    if (!hashOpts.isCompressed) {
        ADDR_BYTES = 32;
        OFFSET_LAYER += 3;
        OFFSET_TREE += 7;
        OFFSET_TYPE += 10;
        OFFSET_KP_ADDR2 += 10;
        OFFSET_KP_ADDR1 += 10;
        OFFSET_CHAIN_ADDR += 10;
        OFFSET_TREE_INDEX += 10;
        OFFSET_HASH_ADDR += 10;
    }
    // Mutates and returns `addr` in place. For the built-in parameter sets, the layer / chain /
    // hash / height / keypair values fit in the low byte(s), and the tree value fits in 64 bits,
    // so the untouched leading bytes in the wider FIPS 205 ADRS / ADRS_c fields stay zero.
    // `height` / `chain` and `index` / `hash` share the same spec words, so callers must use the
    // address-type-specific combinations instead of mixing both meanings in one call.
    const setAddr = (opts, addr = new Uint8Array(ADDR_BYTES)) => {
        const { type, height, tree, layer, index, chain, hash, keypair } = opts;
        const { subtreeAddr, keypairAddr } = opts;
        const v = createView$1(addr);
        if (height !== undefined)
            addr[OFFSET_CHAIN_ADDR] = height;
        if (layer !== undefined)
            addr[OFFSET_LAYER] = layer;
        if (type !== undefined)
            addr[OFFSET_TYPE] = type;
        if (chain !== undefined)
            addr[OFFSET_CHAIN_ADDR] = chain;
        if (hash !== undefined)
            addr[OFFSET_HASH_ADDR] = hash;
        if (index !== undefined)
            v.setUint32(OFFSET_TREE_INDEX, index, false);
        if (subtreeAddr)
            addr.set(subtreeAddr.subarray(0, OFFSET_TREE + 8));
        if (tree !== undefined)
            v.setBigUint64(OFFSET_TREE, tree, false);
        if (keypair !== undefined) {
            addr[OFFSET_KP_ADDR1] = keypair;
            if (TREE_HEIGHT > 8)
                addr[OFFSET_KP_ADDR2] = keypair >>> 8;
        }
        if (keypairAddr) {
            addr.set(keypairAddr.subarray(0, OFFSET_TREE + 8));
            addr[OFFSET_KP_ADDR1] = keypairAddr[OFFSET_KP_ADDR1];
            if (TREE_HEIGHT > 8)
                addr[OFFSET_KP_ADDR2] = keypairAddr[OFFSET_KP_ADDR2];
        }
        return addr;
    };
    const chainCoder = base2b(WOTS_LEN2, WOTS_LOGW);
    const chainLengths = (msg) => {
        const W1 = base2b(WOTS_LEN1, WOTS_LOGW)(msg);
        let csum = 0;
        for (let i = 0; i < W1.length; i++)
            csum += W - 1 - W1[i]; // ▷ Compute checksum
        // csum ← csum ≪ ((8 − ((len2 · lg(w)) mod 8)) mod 8
        csum <<= (8 - ((WOTS_LEN2 * WOTS_LOGW) % 8)) % 8;
        // Checksum to base(LOG_W)
        const W2 = chainCoder(numberToBytesBE(csum, Math.ceil((WOTS_LEN2 * WOTS_LOGW) / 8)));
        // W1 || W2 (concatBytes cannot concat TypedArrays)
        const lengths = new Uint32Array(WOTS_LEN);
        lengths.set(W1);
        lengths.set(W2, W1.length);
        return lengths;
    };
    const messageToIndices = base2b(K, A);
    const TREE_BITS = TREE_HEIGHT * (D - 1);
    const LEAF_BITS = TREE_HEIGHT;
    const hashMsgCoder = splitCoder('hashedMessage', Math.ceil((A * K) / 8), Math.ceil(TREE_BITS / 8), Math.ceil(TREE_HEIGHT / 8));
    // `pkSeed` is the full public key byte string `PK.seed || PK.root`; after splitting `Hmsg`,
    // mask away any spare high bits so `idx_tree` / `idx_leaf` match the spec's final mod-2^k steps.
    const hashMessage = (R, pkSeed, msg, context) => {
        const rawContext = context;
        // digest ← Hmsg(R, PK.seed, PK.root, M)
        const digest = rawContext.Hmsg(R, pkSeed, msg, hashMsgCoder.bytesLen);
        const [md, tmpIdxTree, tmpIdxLeaf] = hashMsgCoder.decode(digest);
        const tree = bytesToNumberBE(tmpIdxTree) & getMaskBig(TREE_BITS);
        const leafIdx = Number(bytesToNumberBE(tmpIdxLeaf)) & getMask(LEAF_BITS);
        return { tree, leafIdx, md };
    };
    // Iterative `xmss_node` / `xmss_sign` core: mutate `treeAddr` in place, collapse completed
    // sibling pairs on `stack`, and record the sibling whenever the current subtree is the auth-path
    // neighbor of the target leaf at that height.
    const treehash = (height, fn) => function treehash_i(context, leafIdx, idxOffset, treeAddr, info) {
        const rawContext = context;
        const leafFn = fn;
        const maxIdx = (1 << height) - 1;
        const stack = new Uint8Array(height * N);
        const authPath = new Uint8Array(height * N);
        for (let idx = 0;; idx++) {
            const current = new Uint8Array(2 * N);
            const cur0 = current.subarray(0, N);
            const cur1 = current.subarray(N);
            const addrOffset = idx + idxOffset;
            cur1.set(leafFn(leafIdx, addrOffset, rawContext, info));
            let h = 0;
            for (let i = idx, o = idxOffset, l = leafIdx;; h++, i >>>= 1, l >>>= 1, o >>>= 1) {
                if (h === height)
                    return { root: cur1, authPath }; // Returns from here
                if ((i ^ l) === 1)
                    authPath.subarray(h * N).set(cur1); // authPath.push(cur1)
                if ((i & 1) === 0 && idx < maxIdx)
                    break;
                setAddr({ height: h + 1, index: (i >> 1) + (o >> 1) }, treeAddr);
                cur0.set(stack.subarray(h * N).subarray(0, N));
                cur1.set(rawContext.thashN(2, current, treeAddr));
            }
            stack.subarray(h * N).set(cur1); // stack.push(cur1)
        }
        // @ts-ignore
        throw new Error('Unreachable code path reached, report this error');
    };
    const wotsTreehash = treehash(TREE_HEIGHT, (leafIdx, addrOffset, context, info) => {
        const rawContext = context;
        const wotsPk = new Uint8Array(WOTS_LEN * N);
        // `keygen()` passes `leafIdx = ~0 >>> 0`, so no real XMSS leaf matches and this suppresses
        // WOTS signature capture while still hashing every chain to its public-key endpoint.
        const wotsKmask = addrOffset === leafIdx ? 0 : -1 >>> 0;
        setAddr({ keypair: addrOffset }, info.leafAddr);
        setAddr({ keypair: addrOffset }, info.pkAddr);
        for (let i = 0; i < WOTS_LEN; i++) {
            const wotsK = info.wotsSteps[i] | wotsKmask;
            const pk = wotsPk.subarray(i * N, (i + 1) * N);
            setAddr({ chain: i, hash: 0, type: AddressType.WOTSPRF }, info.leafAddr);
            pk.set(rawContext.PRFaddr(info.leafAddr));
            setAddr({ type: AddressType.WOTS }, info.leafAddr);
            for (let k = 0;; k++) {
                if (k === wotsK)
                    info.wotsSig.subarray(i * N).set(pk); //wotsSig.push()
                if (k === W - 1)
                    break;
                setAddr({ hash: k }, info.leafAddr);
                pk.set(rawContext.thash1(pk, info.leafAddr));
            }
        }
        return rawContext.thashN(WOTS_LEN, wotsPk, info.pkAddr);
    });
    const forsTreehash = treehash(A, (_, addrOffset, context, forsLeafAddr) => {
        const rawContext = context;
        setAddr({ type: AddressType.FORSPRF, index: addrOffset }, forsLeafAddr);
        const prf = rawContext.PRFaddr(forsLeafAddr);
        setAddr({ type: AddressType.FORSTREE }, forsLeafAddr);
        return rawContext.thash1(prf, forsLeafAddr);
    });
    // Fuse `xmss_sign` with the subtree-root computation needed by `ht_sign`, so one tree walk
    // yields both the WOTS/auth-path signature and the root that the next hypertree layer signs.
    const merkleSign = (context, wotsAddr, treeAddr, leafIdx, prevRoot = new Uint8Array(N)) => {
        setAddr({ type: AddressType.HASHTREE }, treeAddr);
        // State variables
        const info = {
            wotsSig: new Uint8Array(wotsCoder.bytesLen),
            wotsSteps: chainLengths(prevRoot),
            leafAddr: setAddr({ subtreeAddr: wotsAddr }),
            pkAddr: setAddr({ type: AddressType.WOTSPK, subtreeAddr: wotsAddr }),
        };
        const { root, authPath } = wotsTreehash(context, leafIdx, 0, treeAddr, info);
        return {
            root,
            sigWots: info.wotsSig.subarray(0, WOTS_LEN * N),
            sigAuth: authPath,
        };
    };
    const computeRoot = (leaf, leafIdx, idxOffset, authPath, treeHeight, context, addr) => {
        const rawContext = context;
        const buffer = new Uint8Array(2 * N);
        const b0 = buffer.subarray(0, N);
        const b1 = buffer.subarray(N, 2 * N);
        // Algorithm 11 hashes `node || AUTH[k]` for even nodes and `AUTH[k] || node` for odd ones,
        // so reuse one `2N` buffer and just swap which half receives the sibling at each level.
        // `idxOffset` carries the subtree base for the shared FORS path, so `leafIdx + idxOffset`
        // tracks the same tree-global index updates that Algorithms 11 and 17 apply to ADRS.
        // First iter
        if ((leafIdx & 1) !== 0) {
            b1.set(leaf.subarray(0, N));
            b0.set(authPath.subarray(0, N));
        }
        else {
            b0.set(leaf.subarray(0, N));
            b1.set(authPath.subarray(0, N));
        }
        leafIdx >>>= 1;
        idxOffset >>>= 1;
        // Rest
        for (let i = 0; i < treeHeight - 1; i++, leafIdx >>= 1, idxOffset >>= 1) {
            setAddr({ height: i + 1, index: leafIdx + idxOffset }, addr);
            const a = authPath.subarray((i + 1) * N, (i + 2) * N);
            if ((leafIdx & 1) !== 0) {
                b1.set(rawContext.thashN(2, buffer, addr));
                b0.set(a);
            }
            else {
                buffer.set(rawContext.thashN(2, buffer, addr));
                b1.set(a);
            }
        }
        // Root
        setAddr({ height: treeHeight, index: leafIdx + idxOffset }, addr);
        return rawContext.thashN(2, buffer, addr);
    };
    const seedCoder = splitCoder('seed', N, N, N);
    const publicCoder = splitCoder('publicKey', N, N);
    const secretCoder = splitCoder('secretKey', N, N, publicCoder.bytesLen);
    const forsCoder = vecCoder(splitCoder('fors', N, N * A), K);
    const wotsCoder = vecCoder(splitCoder('wots', WOTS_LEN * N, TREE_HEIGHT * N), D);
    const sigCoder = splitCoder('signature', N, forsCoder, wotsCoder); // random || fors || wots
    const internal = Object.freeze({
        info: Object.freeze({ type: 'internal-slh-dsa' }),
        lengths: Object.freeze({
            publicKey: publicCoder.bytesLen,
            secretKey: secretCoder.bytesLen,
            signature: sigCoder.bytesLen,
            seed: seedCoder.bytesLen,
            signRand: N,
        }),
        keygen(seed) {
            if (seed !== undefined)
                abytesDoc(seed, seedCoder.bytesLen, 'seed');
            seed = seed === undefined ? randomBytes$1(seedCoder.bytesLen) : copyBytes$1(seed);
            // Set SK.seed, SK.prf, and PK.seed to random n-byte
            const [secretSeed, secretPRF, publicSeed] = seedCoder.decode(seed);
            const context = getContext(publicSeed, secretSeed);
            // ADRS.setLayerAddress(d − 1)
            const topTreeAddr = setAddr({ layer: D - 1 });
            const wotsAddr = setAddr({ layer: D - 1 });
            //PK.root ←_xmss node(SK.seed, 0, h′, PK.seed, ADRS)
            const { root } = merkleSign(context, wotsAddr, topTreeAddr, -1 >>> 0);
            const publicKey = publicCoder.encode([publicSeed, root]);
            const secretKey = secretCoder.encode([secretSeed, secretPRF, publicKey]);
            context.clean();
            cleanBytes(secretSeed, secretPRF, root, wotsAddr, topTreeAddr);
            return {
                publicKey: publicKey,
                secretKey: secretKey,
            };
        },
        getPublicKey: (secretKey) => {
            const [_skSeed, _skPRF, pk] = secretCoder.decode(secretKey);
            return Uint8Array.from(pk);
        },
        sign: (msg, sk, opts = {}) => {
            validateSigOpts(opts);
            let { extraEntropy: random } = opts;
            const [skSeed, skPRF, pk] = secretCoder.decode(sk); // todo: fix
            const [pkSeed, _] = publicCoder.decode(pk);
            // Set opt_rand to either PK.seed or to a random n-byte string
            if (random === false)
                random = copyBytes$1(pkSeed);
            else if (random === undefined)
                random = randomBytes$1(N);
            else
                random = copyBytes$1(random);
            abytesDoc(random, N);
            const context = getContext(pkSeed, skSeed);
            // Generate randomizer
            const R = context.PRFmsg(skPRF, random, msg); // R ← PRFmsg(SK.prf, opt_rand, M)
            let { tree, leafIdx, md } = hashMessage(R, pk, msg, context);
            // Create FORS signatures
            const wotsAddr = setAddr({
                type: AddressType.WOTS,
                tree,
                keypair: leafIdx,
            });
            const roots = [];
            const forsLeaf = setAddr({ keypairAddr: wotsAddr });
            const forsTreeAddr = setAddr({ keypairAddr: wotsAddr });
            const indices = messageToIndices(md);
            const fors = [];
            for (let i = 0; i < indices.length; i++) {
                const idxOffset = i << A;
                setAddr({
                    type: AddressType.FORSPRF,
                    height: 0,
                    index: indices[i] + idxOffset,
                }, forsTreeAddr);
                const prf = context.PRFaddr(forsTreeAddr);
                setAddr({ type: AddressType.FORSTREE }, forsTreeAddr);
                const { root, authPath } = forsTreehash(context, indices[i], idxOffset, forsTreeAddr, forsLeaf);
                roots.push(root);
                fors.push([prf, authPath]);
            }
            const forsPkAddr = setAddr({
                type: AddressType.FORSPK,
                keypairAddr: wotsAddr,
            });
            const root = context.thashN(K, concatBytes$1(...roots), forsPkAddr);
            // WOTS signatures
            const treeAddr = setAddr({ type: AddressType.HASHTREE });
            const wots = [];
            for (let i = 0; i < D; i++, tree >>= BigInt(TREE_HEIGHT)) {
                setAddr({ tree, layer: i }, treeAddr);
                setAddr({ subtreeAddr: treeAddr, keypair: leafIdx }, wotsAddr);
                const { sigWots, sigAuth, root: r, } = merkleSign(context, wotsAddr, treeAddr, leafIdx, root);
                root.set(r);
                cleanBytes(r);
                wots.push([sigWots, sigAuth]);
                leafIdx = Number(tree & getMaskBig(TREE_HEIGHT));
            }
            context.clean();
            const SIG = sigCoder.encode([R, fors, wots]);
            cleanBytes(R, random, treeAddr, wotsAddr, forsLeaf, forsTreeAddr, indices, roots);
            return SIG;
        },
        verify: (sig, msg, publicKey) => {
            const [pkSeed, pubRoot] = publicCoder.decode(publicKey);
            const [random, forsVec, wotsVec] = sigCoder.decode(sig);
            const pk = publicKey;
            if (sig.length !== sigCoder.bytesLen)
                return false;
            const context = getContext(pkSeed);
            let { tree, leafIdx, md } = hashMessage(random, pk, msg, context);
            const wotsAddr = setAddr({
                type: AddressType.WOTS,
                tree,
                keypair: leafIdx,
            });
            // FORS signature
            const roots = [];
            const forsTreeAddr = setAddr({
                type: AddressType.FORSTREE,
                keypairAddr: wotsAddr,
            });
            const indices = messageToIndices(md);
            for (let i = 0; i < forsVec.length; i++) {
                const [prf, authPath] = forsVec[i];
                const idxOffset = i << A;
                setAddr({ height: 0, index: indices[i] + idxOffset }, forsTreeAddr);
                const leaf = context.thash1(prf, forsTreeAddr);
                // Compute inplace, because we need all roots in same byte array
                roots.push(computeRoot(leaf, indices[i], idxOffset, authPath, A, context, forsTreeAddr));
            }
            const forsPkAddr = setAddr({
                type: AddressType.FORSPK,
                keypairAddr: wotsAddr,
            });
            let root = context.thashN(K, concatBytes$1(...roots), forsPkAddr); // root = thash()
            // WOTS signature
            const treeAddr = setAddr({ type: AddressType.HASHTREE });
            const wotsPkAddr = setAddr({ type: AddressType.WOTSPK });
            const wotsPk = new Uint8Array(WOTS_LEN * N);
            for (let i = 0; i < wotsVec.length; i++, tree >>= BigInt(TREE_HEIGHT)) {
                const [wots, sigAuth] = wotsVec[i];
                setAddr({ tree, layer: i }, treeAddr);
                setAddr({ subtreeAddr: treeAddr, keypair: leafIdx }, wotsAddr);
                setAddr({ keypairAddr: wotsAddr }, wotsPkAddr);
                const lengths = chainLengths(root);
                for (let i = 0; i < WOTS_LEN; i++) {
                    setAddr({ chain: i }, wotsAddr);
                    const steps = W - 1 - lengths[i];
                    const start = lengths[i];
                    const out = wotsPk.subarray(i * N);
                    out.set(wots.subarray(i * N, (i + 1) * N));
                    for (let j = start; j < start + steps && j < W; j++) {
                        setAddr({ hash: j }, wotsAddr);
                        out.set(context.thash1(out, wotsAddr));
                    }
                }
                const leaf = context.thashN(WOTS_LEN, wotsPk, wotsPkAddr);
                root = computeRoot(leaf, leafIdx, 0, sigAuth, TREE_HEIGHT, context, treeAddr);
                leafIdx = Number(tree & getMaskBig(TREE_HEIGHT));
            }
            return equalBytes$1(root, pubRoot);
        },
    });
    return Object.freeze({
        info: Object.freeze({ type: 'slh-dsa' }),
        internal,
        securityLevel: securityLevel,
        lengths: internal.lengths,
        keygen: internal.keygen,
        getPublicKey: internal.getPublicKey,
        sign: (msg, secretKey, opts = {}) => {
            validateSigOpts(opts);
            const M = getMessage(msg, opts.context);
            const res = internal.sign(M, secretKey, opts);
            cleanBytes(M);
            return res;
        },
        verify: (sig, msg, publicKey, opts = {}) => {
            validateVerOpts(opts);
            return internal.verify(sig, getMessage(msg, opts.context), publicKey);
        },
        prehash: (hash) => {
            checkHash(hash, securityLevel);
            const rawHash = hash;
            return Object.freeze({
                info: Object.freeze({ type: 'hashslh-dsa' }),
                lengths: internal.lengths,
                keygen: internal.keygen,
                getPublicKey: internal.getPublicKey,
                sign: (msg, secretKey, opts = {}) => {
                    validateSigOpts(opts);
                    const M = getMessagePrehash(rawHash, msg, opts.context);
                    const res = internal.sign(M, secretKey, opts);
                    cleanBytes(M);
                    return res;
                },
                verify: (sig, msg, publicKey, opts = {}) => {
                    validateVerOpts(opts);
                    return internal.verify(sig, getMessagePrehash(rawHash, msg, opts.context), publicKey);
                },
            });
        },
    });
}
// FIPS 205 §11.1 SHAKE instantiation: this path hashes the full uncompressed address bytes,
// unlike the compressed 22-byte SHA2 path in §11.2.
const genShake = () => (opts) => (pubSeed, skSeed) => {
    const { N } = opts;
    // §11.1 prefixes PRF/F/H/T_l with `PK.seed`, so cache that absorbed prefix once and clone it
    // for each address-bound call instead of reabsorbing the same seed every time.
    const h0 = shake256.create({}).update(pubSeed);
    const h0tmp = h0.clone();
    const thash = (blocks, input, addr) => {
        return h0
            ._cloneInto(h0tmp)
            .update(addr)
            .update(input.subarray(0, blocks * N))
            .xof(N);
    };
    return {
        PRFaddr: (addr) => {
            if (!skSeed)
                throw new Error('no sk seed');
            const res = h0._cloneInto(h0tmp).update(addr).update(skSeed).xof(N);
            return res;
        },
        PRFmsg: (skPRF, random, msg) => {
            return shake256
                .create({})
                .update(skPRF)
                .update(random)
                .update(msg)
                .digest()
                .subarray(0, N);
        },
        Hmsg: (R, pk, m, outLen) => {
            return shake256.create({}).update(R.subarray(0, N)).update(pk).update(m).xof(outLen);
        },
        thash1: thash.bind(null, 1),
        thashN: thash,
        clean: () => {
            h0.destroy();
            h0tmp.destroy();
            //console.log(stats);
        },
    };
};
const SHAKE_SIMPLE = /* @__PURE__ */ (() => ({ getContext: genShake() }))();
/**
 * SLH-DSA-SHAKE-128s: Table 2 row `n=16, h=63, d=7, h'=9, a=12, k=14, lg w=4, m=30`;
 * lengths `publicKey=32`, `secretKey=64`, `signature=7856`, `seed=48`, `signRand=16`.
 * Also exposes `.prehash(...)`.
 */
const slh_dsa_shake_128s = /* @__PURE__ */ (() => gen(PARAMS['128s'], SHAKE_SIMPLE))();
/**
 * SLH-DSA-SHAKE-256s: Table 2 row `n=32, h=64, d=8, h'=8, a=14, k=22, lg w=4, m=47`;
 * lengths `publicKey=64`, `secretKey=128`, `signature=29792`, `seed=96`, `signRand=32`.
 * Also exposes `.prehash(...)`.
 */
const slh_dsa_shake_256s = /* @__PURE__ */ (() => gen(PARAMS['256s'], SHAKE_SIMPLE))();

/**
 * Defines the numerical identifiers for supported cryptographic schemes and algorithms,
 * including both post-quantum (e.g., ML-DSA, ML-KEM, SLH-DSA) and traditional algorithms.
 */
const SCHEME_TYPES$1 = {
	MASTER: 0,
	// Dilithium2 (Signature)
	ML_DSA_44: 1,
	Dilithium2: 1,
	// Dilithium3 (Signature)
	ML_DSA_65: 2,
	Dilithium3: 2,
	// Dilithium5 (Signature)
	ML_DSA_87: 3,
	dilithium5: 3,
	// SPHINCS+ 128-bit simple (Signature)
	SLH_DSA_128S: 4,
	SPHINCS_128S: 4,
	// SPHINCS+ 256-bit simple (Signature)
	SLH_DSA_256S: 5,
	SPHINCS_256S: 5,
	// Kyber-512 (KEM)
	ML_KEM_512: 6,
	kyber_512: 6,
	// Kyber-768 (KEM)
	ML_KEM_768: 7,
	kyber_768: 7,
	// Kyber-1024 (KEM)
	ML_KEM_1024: 8,
	kyber_1024: 8,
	// AES-256 or ChaCha20 keys
	SYMMETRIC_256: 9,
	// Symmetric keys for higher security
	SYMMETRIC_512: 10,
	// NONCE
	NONCE: 11,
	// SEED
	SEED: 12,
	// Edwards-curve Digital Signature Algorithm
	ED25519: 13,
	// Elliptic-curve Diffie–Hellman key exchange
	X25519: 14,
	// eXtended Merkle Signature Scheme
	XMSS: 15,
	// Leighton-Micali Signatures
	LMS: 16,
};
const TRAPDOOR_SCHEME_TYPES$1 = {
	ML_DSA_44: 0,
	ML_DSA_65: 1,
	ML_DSA_87: 2,
};
/**
 * Specifies the fixed byte sizes associated with the generated output seed
 * material corresponding to specific cryptographic scheme derivations.
 */
const SEED_SIZES = {
	[SCHEME_TYPES$1.ML_KEM_512]: 32,
	[SCHEME_TYPES$1.ML_KEM_768]: 32,
	[SCHEME_TYPES$1.ML_KEM_1024]: 32,
	[SCHEME_TYPES$1.ML_DSA_44]: 32,
	[SCHEME_TYPES$1.ML_DSA_65]: 32,
	[SCHEME_TYPES$1.ML_DSA_87]: 32,
	[SCHEME_TYPES$1.SPHINCS_128S]: 32,
	[SCHEME_TYPES$1.SPHINCS_256S]: 32,
	[SCHEME_TYPES$1.SLH_DSA]: 32,
	[SCHEME_TYPES$1.SYMMETRIC_256]: 32,
	[SCHEME_TYPES$1.SYMMETRIC_512]: 64,
};
/**
 * Provides direct mapping of predefined scheme numerical IDs to their
 * corresponding underlying imported core cryptography functions.
 */
({
	[SCHEME_TYPES$1.ML_DSA_44]: ml_dsa44,
	[SCHEME_TYPES$1.ML_DSA_65]: ml_dsa65,
	[SCHEME_TYPES$1.ML_DSA_87]: ml_dsa87,
	[SCHEME_TYPES$1.ML_KEM_512]: ml_kem512,
	[SCHEME_TYPES$1.ML_KEM_768]: ml_kem768,
	[SCHEME_TYPES$1.ML_KEM_1024]: ml_kem1024,
	[SCHEME_TYPES$1.ED25519]: ed25519,
	[SCHEME_TYPES$1.X25519]: x25519,
	[SCHEME_TYPES$1.SLH_DSA_128S]: slh_dsa_shake_128s,
	[SCHEME_TYPES$1.SLH_DSA_256S]: slh_dsa_shake_256s,
});
/**
 * CONTEXT_INTENTION flags that define what type of outcome the current HDST derivation
 * targets, such as deriving a KEY or generating a new final SEED.
 * What is the object being used to create. A PRE-KEY -> KEY, KEY -> SEED,.
 */
const CONTEXT_INTENTION$1 = {
	SEED: 0,
	KEY: 1,
	NONCE: 2,
	FINAL_SEED: 3,
	KEYPAIR: 4,
	SECRET_KEY: 5,
};
// Purpose codes for key usage
/**
 * Designates the functional purpose of a key/seed within the HDST paths,
 * aligning with standard derivations for signing, exchanging, or standalone keys.
 */
const PURPOSE$1 = {
	// signing
	SIGN: 0,
	// Key Exchange
	KEY_EXCHANGE: 1,
	// Secret Key
	KEY: 2,
	// Trapdoor
	TRAPDOOR: 3,
};
/**
 * Specifies the hashing algorithms and variants for uniform mapping, digest,
 * or extended output sequences required in derivation paths.
 */
const HASH_ALGORITHMS$1 = {
	SHAKE_256: 1,
	SHA3_256: 2,
	SHA3_512: 3,
	BLAKE3: 4,
};
/**
 * Specifies the keyed hashing algorithms and variants for uniform mapping, digest,
 * or extended output sequences required in derivation paths.
 */
const KEYED_HASH_ALGORITHMS$1 = {
	KMAC_256_XOF: 1,
	KMAC_256: 2,
};
/**
 * Specifies the Extendable-output function XOF hashing algorithms and variants for uniform mapping, digest,
 * or extended output sequences required in derivation paths.
 */
const XOF_HASH_ALGORITHMS$1 = {
	SHAKE_256: 0,
	BLAKE3: 1,
};
const USER_INPUT_HASH_ALGORITHMS$1 = {
	ARGON2ID: 0,
};
/**
 * Specifies standard base entropy lengths when generating the foundational
 * MASTER seed values that derive the rest of the HDST tree.
 * All entropy pool sizes are in bytes, and the final seed output may be derived to a different size.
 */
const MASTER_ENTROPY_POOL_SIZES$1 = {
	MIN: 32,
	DEFAULT: 64,
	MID: 128,
	MAX: 256,
	BROWSER: 64,
};
/**
 * Specifies the allowed sizes in bytes for raw symmetric keys or
 * deterministic raw secret derivations in predefined environments.
 */
const SECRET_KEY_SIZES = {
	key_64_bytes: 64};
var cryptoDefaults = {
	SCHEME_TYPES: SCHEME_TYPES$1,
	TRAPDOOR_SCHEME_TYPES: TRAPDOOR_SCHEME_TYPES$1,
	CONTEXT_INTENTION: CONTEXT_INTENTION$1,
	PURPOSE: PURPOSE$1,
	HASH_ALGORITHMS: HASH_ALGORITHMS$1,
	KEYED_HASH_ALGORITHMS: KEYED_HASH_ALGORITHMS$1,
	XOF_HASH_ALGORITHMS: XOF_HASH_ALGORITHMS$1,
	MASTER_ENTROPY_POOL_SIZES: MASTER_ENTROPY_POOL_SIZES$1,
	USER_INPUT_HASH_ALGORITHMS: USER_INPUT_HASH_ALGORITHMS$1,
};

/**
 * Configures the types of generalized software services/topologies that nodes,
 * wallets, or applications align with across the Universal/Network structure.
 */
var serviceDefaults = {
	};

/**
 * @file Defaults.js.
 * @description Defines the core constants, configuration schemas, and enumerations for Hierarchical Deterministic seeds, wallets, keys, and key pairs.
 * It also defines structural constants for trees (relationships, direction), networking environments, application topologies, cryptography, and generic key derivations (context, purpose, schemas).
 * NOTE: This file is using JS libs for browser usage but will need a wrapper for WASM/native modules to ensure  performance.
 */
const {
	CONTEXT_INTENTION, PURPOSE, SCHEME_TYPES,
	TRAPDOOR_SCHEME_TYPES, HASH_ALGORITHMS,
	KEYED_HASH_ALGORITHMS, XOF_HASH_ALGORITHMS, USER_INPUT_HASH_ALGORITHMS,
	MASTER_ENTROPY_POOL_SIZES,
} = cryptoDefaults;
const { CRYPTOCURRENCY_NETWORK_TYPES } = cryptoCurrencyDefaults;
const {
	NETWORK_NAMES} = serviceDefaults;
/**
 * Represents the type of cryptographic object being generated or derived in the HDST
 * sequence, distinguishing between pre-states and final deterministic outputs.
 */
const OBJECT_TYPE = {
	PRE_SEED: 0,
	SEED: 1,
	PRE_KEY: 2,
	KEY: 3,
	PRE_NONCE: 4,
	NONCE: 5,
	TRAPDOOR: 6,
	SALT: 7,
};
/**
 * Represents the connection dynamic between two points/nodes in a derivation
 * hierarchy. E.g., PARENT to CHILD, BRANCH to LEAF.
 */
const RELATIONSHIP = {
	PARENT: 0,
	CHILD: 1,
	BRANCH: 2,
	LEAF: 3,
	ROOT: 4,
};
/**
 * Categorizes the Universal Account Identity or Profile linked to a specific
 * HD Seed Tree structure, enabling distinct application capabilities.
 */
const PROFILE_TYPES = {
	PERSONAL: 0,
	BUSINESS: 1,
	SYSTEM: 2,
	DEVICE: 3,
	AI_AGENT: 4,
	SMART_CONTRACT: 5,
	NODE: 6,
};
/**
 * Defines the default mapping structure used to assemble the Key (K)
 * parameter for KMAC operations, utilized to construct the final deterministic seed.
 */
({
	scheme: SCHEME_TYPES.MASTER,
	context_intention: CONTEXT_INTENTION.FINAL_SEED,
});
/**
 * Defines a universal baseline object structure utilized as the generic
 * fallback or initialization state for elements within the HDST hierarchy.
 */
({
	object_type: OBJECT_TYPE.SEED,
	scheme: SCHEME_TYPES.MASTER,
	context_intention: CONTEXT_INTENTION.SEED,
	purpose: PURPOSE.KEY,
	relationship: RELATIONSHIP.ROOT,
	network: CRYPTOCURRENCY_NETWORK_TYPES.MAINNET,
});
/**
 * Defines the structural template for generating the Customization
 * field / String (S) passed into KMAC for strict domain separation.
 */
({
	profile: PROFILE_TYPES.PERSONAL,
	purpose: PURPOSE.KEY,
});
// Generator function to create reverse lookup maps
function createReverseLookup(obj) {
	if (!obj) {
		console.error('createReverseLookup requires an object');
		throw new Error('Invalid object provided to createReverseLookup');
	}
	const result = new Map();
	for (const key in obj) {
		if (Object.hasOwn(obj, key)) {
			result.set(obj[key], key);
		}
	}
	return result;
}
const PROPERTY_NAMES = {
	context_intention: CONTEXT_INTENTION,
	cryptocurrency_network_type: CRYPTOCURRENCY_NETWORK_TYPES,
	hash_algorithm: HASH_ALGORITHMS,
	horizontal_id: null,
	id: null,
	keyed_hash_algorithm: KEYED_HASH_ALGORITHMS,
	object_type: OBJECT_TYPE,
	master_key: null,
	master_nonce: null,
	master_salt: null,
	master_seed: null,
	network_name: NETWORK_NAMES,
	profile_type: PROFILE_TYPES,
	purpose: PURPOSE,
	relationship: RELATIONSHIP,
	scheme: SCHEME_TYPES,
	seed_size: MASTER_ENTROPY_POOL_SIZES,
	trapdoor_scheme: TRAPDOOR_SCHEME_TYPES,
	version: null,
	vertical_id: null,
	xof_hash_algorithm: XOF_HASH_ALGORITHMS,
	user_input_hash_algorithm: USER_INPUT_HASH_ALGORITHMS,
};
const VALID_PROPERTY_NAMES = keys(PROPERTY_NAMES);
const PROPERTY_LOOKUP = {};
VALID_PROPERTY_NAMES.forEach((propName) => {
	PROPERTY_NAMES[propName] && (PROPERTY_LOOKUP[propName] = createReverseLookup(PROPERTY_NAMES[propName]));
});
// example();

let decoder;
try {
	decoder = new TextDecoder();
} catch(error) {}
let src;
let srcEnd;
let position$1 = 0;
const LEGACY_RECORD_INLINE_ID = 105;
const RECORD_DEFINITIONS_ID = 0xdffe;
const RECORD_INLINE_ID = 0xdfff; // temporary first-come first-serve tag // proposed tag: 0x7265 // 're'
const BUNDLED_STRINGS_ID = 0xdff9;
const PACKED_REFERENCE_TAG_ID = 6;
const STOP_CODE = {};
let maxArraySize = 112810000; // This is the maximum array size in V8. We would potentially detect and set it higher
// for JSC, but this is pretty large and should be sufficient for most use cases
let maxMapSize = 16810000; // JavaScript has a fixed maximum map size of about 16710000, but JS itself enforces this,
let currentDecoder = {};
let currentStructures;
let srcString;
let srcStringStart = 0;
let srcStringEnd = 0;
let bundledStrings$1;
let referenceMap;
let currentExtensions = [];
let currentExtensionRanges = [];
let packedValues;
let dataView$1;
let restoreMapsAsObject;
let defaultOptions = {
	useRecords: false,
	mapsAsObjects: true
};
let sequentialMode = false;
let inlineObjectReadThreshold = 2;
// no-eval build
try {
	new Function('');
} catch(error) {
	// if eval variants are not supported, do not create inline object readers ever
	inlineObjectReadThreshold = Infinity;
}



class Decoder {
	constructor(options) {
		if (options) {
			if ((options.keyMap || options._keyMap) && !options.useRecords) {
				options.useRecords = false;
				options.mapsAsObjects = true;
			}
			if (options.useRecords === false && options.mapsAsObjects === undefined)
				options.mapsAsObjects = true;
			if (options.getStructures)
				options.getShared = options.getStructures;
			if (options.getShared && !options.structures)
				(options.structures = []).uninitialized = true; // this is what we use to denote an uninitialized structures
			if (options.keyMap) {
				this.mapKey = new Map();
				for (let [k,v] of Object.entries(options.keyMap)) this.mapKey.set(v,k);
			}
		}
		Object.assign(this, options);
	}
	/*
	decodeKey(key) {
		return this.keyMap
			? Object.keys(this.keyMap)[Object.values(this.keyMap).indexOf(key)] || key
			: key
	}
	*/
	decodeKey(key) {
		return this.keyMap ? this.mapKey.get(key) || key : key
	}
	
	encodeKey(key) {
		return this.keyMap && this.keyMap.hasOwnProperty(key) ? this.keyMap[key] : key
	}

	encodeKeys(rec) {
		if (!this._keyMap) return rec
		let map = new Map();
		for (let [k,v] of Object.entries(rec)) map.set((this._keyMap.hasOwnProperty(k) ? this._keyMap[k] : k), v);
		return map
	}

	decodeKeys(map) {
		if (!this._keyMap || map.constructor.name != 'Map') return map
		if (!this._mapKey) {
			this._mapKey = new Map();
			for (let [k,v] of Object.entries(this._keyMap)) this._mapKey.set(v,k);
		}
		let res = {};
		//map.forEach((v,k) => res[Object.keys(this._keyMap)[Object.values(this._keyMap).indexOf(k)] || k] = v)
		map.forEach((v,k) => res[safeKey(this._mapKey.has(k) ? this._mapKey.get(k) : k)] =  v);
		return res
	}
	
	mapDecode(source, end) {
	
		let res = this.decode(source);
		if (this._keyMap) { 
			//Experiemntal support for Optimised KeyMap  decoding 
			switch (res.constructor.name) {
				case 'Array': return res.map(r => this.decodeKeys(r))
				//case 'Map': return this.decodeKeys(res)
			}
		}
		return res
	}

	decode(source, end) {
		if (src) {
			// re-entrant execution, save the state and restore it after we do this decode
			return saveState(() => {
				clearSource();
				return this ? this.decode(source, end) : Decoder.prototype.decode.call(defaultOptions, source, end)
			})
		}
		srcEnd = end > -1 ? end : source.length;
		position$1 = 0;
		srcStringEnd = 0;
		srcString = null;
		bundledStrings$1 = null;
		src = source;
		// this provides cached access to the data view for a buffer if it is getting reused, which is a recommend
		// technique for getting data from a database where it can be copied into an existing buffer instead of creating
		// new ones
		try {
			dataView$1 = source.dataView || (source.dataView = new DataView(source.buffer, source.byteOffset, source.byteLength));
		} catch(error) {
			// if it doesn't have a buffer, maybe it is the wrong type of object
			src = null;
			if (source instanceof Uint8Array)
				throw error
			throw new Error('Source must be a Uint8Array or Buffer but was a ' + ((source && typeof source == 'object') ? source.constructor.name : typeof source))
		}
		if (this instanceof Decoder) {
			currentDecoder = this;
			packedValues = this.sharedValues &&
				(this.pack ? new Array(this.maxPrivatePackedValues || 16).concat(this.sharedValues) :
				this.sharedValues);
			if (this.structures) {
				currentStructures = this.structures;
				return checkedRead()
			} else if (!currentStructures || currentStructures.length > 0) {
				currentStructures = [];
			}
		} else {
			currentDecoder = defaultOptions;
			if (!currentStructures || currentStructures.length > 0)
				currentStructures = [];
			packedValues = null;
		}
		return checkedRead()
	}
	decodeMultiple(source, forEach) {
		let values, lastPosition = 0;
		try {
			let size = source.length;
			sequentialMode = true;
			let value = this ? this.decode(source, size) : defaultDecoder.decode(source, size);
			if (forEach) {
				if (forEach(value) === false) {
					return
				}
				while(position$1 < size) {
					lastPosition = position$1;
					if (forEach(checkedRead()) === false) {
						return
					}
				}
			}
			else {
				values = [ value ];
				while(position$1 < size) {
					lastPosition = position$1;
					values.push(checkedRead());
				}
				return values
			}
		} catch(error) {
			error.lastPosition = lastPosition;
			error.values = values;
			throw error
		} finally {
			sequentialMode = false;
			clearSource();
		}
	}
}
function checkedRead() {
	try {
		let result = read();
		if (bundledStrings$1) {
			if (position$1 >= bundledStrings$1.postBundlePosition) {
				let error = new Error('Unexpected bundle position');
				error.incomplete = true;
				throw error
			}
			// bundled strings to skip past
			position$1 = bundledStrings$1.postBundlePosition;
			bundledStrings$1 = null;
		}

		if (position$1 == srcEnd) {
			// finished reading this source, cleanup references
			currentStructures = null;
			src = null;
			if (referenceMap)
				referenceMap = null;
		} else if (position$1 > srcEnd) {
			// over read
			let error = new Error('Unexpected end of CBOR data');
			error.incomplete = true;
			throw error
		} else if (!sequentialMode) {
			throw new Error('Data read, but end of buffer not reached')
		}
		// else more to read, but we are reading sequentially, so don't clear source yet
		return result
	} catch(error) {
		clearSource();
		if (error instanceof RangeError || error.message.startsWith('Unexpected end of buffer')) {
			error.incomplete = true;
		}
		throw error
	}
}

function read() {
	let token = src[position$1++];
	let majorType = token >> 5;
	token = token & 0x1f;
	if (token > 0x17) {
		switch (token) {
			case 0x18:
				token = src[position$1++];
				break
			case 0x19:
				if (majorType == 7) {
					return getFloat16()
				}
				token = dataView$1.getUint16(position$1);
				position$1 += 2;
				break
			case 0x1a:
				if (majorType == 7) {
					let value = dataView$1.getFloat32(position$1);
					if (currentDecoder.useFloat32 > 2) {
						// this does rounding of numbers that were encoded in 32-bit float to nearest significant decimal digit that could be preserved
						let multiplier = mult10[((src[position$1] & 0x7f) << 1) | (src[position$1 + 1] >> 7)];
						position$1 += 4;
						return ((multiplier * value + (value > 0 ? 0.5 : -0.5)) >> 0) / multiplier
					}
					position$1 += 4;
					return value
				}
				token = dataView$1.getUint32(position$1);
				position$1 += 4;
				if (majorType === 1) return -1 - token; // can't safely use negation operator here
				break
			case 0x1b:
				if (majorType == 7) {
					let value = dataView$1.getFloat64(position$1);
					position$1 += 8;
					return value
				}
				if (majorType > 1) {
					if (dataView$1.getUint32(position$1) > 0)
						throw new Error('JavaScript does not support arrays, maps, or strings with length over 4294967295')
					token = dataView$1.getUint32(position$1 + 4);
				} else if (currentDecoder.int64AsNumber) {
					token = dataView$1.getUint32(position$1) * 0x100000000;
					token += dataView$1.getUint32(position$1 + 4);
				} else token = dataView$1.getBigUint64(position$1);
				position$1 += 8;
				break
			case 0x1f: 
				// indefinite length
				switch(majorType) {
					case 2: // byte string
					case 3: // text string
						throw new Error('Indefinite length not supported for byte or text strings')
					case 4: // array
						let array = [];
						let value, i = 0;
						while ((value = read()) != STOP_CODE) {
							if (i >= maxArraySize) throw new Error(`Array length exceeds ${maxArraySize}`)
							array[i++] = value;
						}
						return majorType == 4 ? array : majorType == 3 ? array.join('') : bufferExports.Buffer.concat(array)
					case 5: // map
						let key;
						if (currentDecoder.mapsAsObjects) {
							let object = {};
							let i = 0;
							if (currentDecoder.keyMap) {
								while((key = read()) != STOP_CODE) {
									if (i++ >= maxMapSize) throw new Error(`Property count exceeds ${maxMapSize}`)
									object[safeKey(currentDecoder.decodeKey(key))] = read();
								}
							}
							else {
								while ((key = read()) != STOP_CODE) {
									if (i++ >= maxMapSize) throw new Error(`Property count exceeds ${maxMapSize}`)
									object[safeKey(key)] = read();
								}
							}
							return object
						} else {
							if (restoreMapsAsObject) {
								currentDecoder.mapsAsObjects = true;
								restoreMapsAsObject = false;
							}
							let map = new Map();
							if (currentDecoder.keyMap) {
								let i = 0;
								while((key = read()) != STOP_CODE) {
									if (i++ >= maxMapSize) {
										throw new Error(`Map size exceeds ${maxMapSize}`);
									}
									map.set(currentDecoder.decodeKey(key), read());
								}
							}
							else {
								let i = 0;
								while ((key = read()) != STOP_CODE) {
									if (i++ >= maxMapSize) {
										throw new Error(`Map size exceeds ${maxMapSize}`);
									}
									map.set(key, read());
								}
							}
							return map
						}
					case 7:
						return STOP_CODE
					default:
						throw new Error('Invalid major type for indefinite length ' + majorType)
				}
			default:
				throw new Error('Unknown token ' + token)
		}
	}
	switch (majorType) {
		case 0: // positive int
			return token
		case 1: // negative int
			return ~token
		case 2: // buffer
			return readBin(token)
		case 3: // string
			if (srcStringEnd >= position$1) {
				return srcString.slice(position$1 - srcStringStart, (position$1 += token) - srcStringStart)
			}
			if (srcStringEnd == 0 && srcEnd < 140 && token < 32) {
				// for small blocks, avoiding the overhead of the extract call is helpful
				let string = token < 16 ? shortStringInJS(token) : longStringInJS(token);
				if (string != null)
					return string
			}
			return readFixedString(token)
		case 4: // array
			if (token >= maxArraySize) throw new Error(`Array length exceeds ${maxArraySize}`)
			let array = new Array(token);
		  //if (currentDecoder.keyMap) for (let i = 0; i < token; i++) array[i] = currentDecoder.decodeKey(read())	
			//else 
			for (let i = 0; i < token; i++) array[i] = read();
			return array
		case 5: // map
			if (token >= maxMapSize) throw new Error(`Map size exceeds ${maxArraySize}`)
			if (currentDecoder.mapsAsObjects) {
				let object = {};
				if (currentDecoder.keyMap) for (let i = 0; i < token; i++) object[safeKey(currentDecoder.decodeKey(read()))] = read();
				else for (let i = 0; i < token; i++) object[safeKey(read())] = read();
				return object
			} else {
				if (restoreMapsAsObject) {
					currentDecoder.mapsAsObjects = true;
					restoreMapsAsObject = false;
				}
				let map = new Map();
				if (currentDecoder.keyMap) for (let i = 0; i < token; i++) map.set(currentDecoder.decodeKey(read()),read());
				else for (let i = 0; i < token; i++) map.set(read(), read());
				return map
			}
		case 6: // extension
			if (token >= BUNDLED_STRINGS_ID) {
				let structure = currentStructures[token & 0x1fff]; // check record structures first
				// At some point we may provide an option for dynamic tag assignment with a range like token >= 8 && (token < 16 || (token > 0x80 && token < 0xc0) || (token > 0x130 && token < 0x4000))
				if (structure) {
					if (!structure.read) structure.read = createStructureReader(structure);
					return structure.read()
				}
				if (token < 0x10000) {
					if (token == RECORD_INLINE_ID) { // we do a special check for this so that we can keep the
						// currentExtensions as densely stored array (v8 stores arrays densely under about 3000 elements)
						let length = readJustLength();
						let id = read();
						let structure = read();
						recordDefinition(id, structure);
						let object = {};
						if (currentDecoder.keyMap) for (let i = 2; i < length; i++) {
							let key = currentDecoder.decodeKey(structure[i - 2]);
							object[safeKey(key)] = read();
						}
						else for (let i = 2; i < length; i++) {
							let key = structure[i - 2];
							object[safeKey(key)] = read();
						}
						return object
					}
					else if (token == RECORD_DEFINITIONS_ID) {
						let length = readJustLength();
						let id = read();
						for (let i = 2; i < length; i++) {
							recordDefinition(id++, read());
						}
						return read()
					} else if (token == BUNDLED_STRINGS_ID) {
						return readBundleExt()
					}
					if (currentDecoder.getShared) {
						loadShared();
						structure = currentStructures[token & 0x1fff];
						if (structure) {
							if (!structure.read)
								structure.read = createStructureReader(structure);
							return structure.read()
						}
					}
				}
			}
			let extension = currentExtensions[token];
			if (extension) {
				if (extension.handlesRead)
					return extension(read)
				else
					return extension(read())
			} else {
				let input = read();
				for (let i = 0; i < currentExtensionRanges.length; i++) {
					let value = currentExtensionRanges[i](token, input);
					if (value !== undefined)
						return value
				}
				return new Tag(input, token)
			}
		case 7: // fixed value
			switch (token) {
				case 0x14: return false
				case 0x15: return true
				case 0x16: return null
				case 0x17: return; // undefined
				case 0x1f:
				default:
					let packedValue = (packedValues || getPackedValues())[token];
					if (packedValue !== undefined)
						return packedValue
					throw new Error('Unknown token ' + token)
			}
		default: // negative int
			if (isNaN(token)) {
				let error = new Error('Unexpected end of CBOR data');
				error.incomplete = true;
				throw error
			}
			throw new Error('Unknown CBOR token ' + token)
	}
}
const validName = /^[a-zA-Z_$][a-zA-Z\d_$]*$/;
function createStructureReader(structure) {
	if (!structure) throw new Error('Structure is required in record definition');
	function readObject() {
		// get the array size from the header
		let length = src[position$1++];
		//let majorType = token >> 5
		length = length & 0x1f;
		if (length > 0x17) {
			switch (length) {
				case 0x18:
					length = src[position$1++];
					break
				case 0x19:
					length = dataView$1.getUint16(position$1);
					position$1 += 2;
					break
				case 0x1a:
					length = dataView$1.getUint32(position$1);
					position$1 += 4;
					break
				default:
					throw new Error('Expected array header, but got ' + src[position$1 - 1])
			}
		}
		// This initial function is quick to instantiate, but runs slower. After several iterations pay the cost to build the faster function
		let compiledReader = this.compiledReader; // first look to see if we have the fast compiled function
		while(compiledReader) {
			// we have a fast compiled object literal reader
			if (compiledReader.propertyCount === length)
				return compiledReader(read) // with the right length, so we use it
			compiledReader = compiledReader.next; // see if there is another reader with the right length
		}
		if (this.slowReads++ >= inlineObjectReadThreshold) { // create a fast compiled reader
			let array = this.length == length ? this : this.slice(0, length);
			compiledReader = currentDecoder.keyMap 
			? new Function('r', 'return {' + array.map(k => currentDecoder.decodeKey(k)).map(k => validName.test(k) ? safeKey(k) + ':r()' : ('[' + JSON.stringify(k) + ']:r()')).join(',') + '}')
			: new Function('r', 'return {' + array.map(key => validName.test(key) ? safeKey(key) + ':r()' : ('[' + JSON.stringify(key) + ']:r()')).join(',') + '}');
			if (this.compiledReader)
				compiledReader.next = this.compiledReader; // if there is an existing one, we store multiple readers as a linked list because it is usually pretty rare to have multiple readers (of different length) for the same structure
			compiledReader.propertyCount = length;
			this.compiledReader = compiledReader;
			return compiledReader(read)
		}
		let object = {};
		if (currentDecoder.keyMap) for (let i = 0; i < length; i++) object[safeKey(currentDecoder.decodeKey(this[i]))] = read();
		else for (let i = 0; i < length; i++) {
			object[safeKey(this[i])] = read();
		}
		return object
	}
	structure.slowReads = 0;
	return readObject
}

function safeKey(key) {
	// protect against prototype pollution
	if (typeof key === 'string') return key === '__proto__' ? '__proto_' : key
	if (typeof key === 'number' || typeof key === 'boolean' || typeof key === 'bigint') return key.toString();
	if (key == null) return key + '';
	// protect against expensive (DoS) string conversions
	throw new Error('Invalid property name type ' + typeof key);
}

let readFixedString = readStringJS;
function readStringJS(length) {
	let result;
	if (length < 16) {
		if (result = shortStringInJS(length))
			return result
	}
	if (length > 64 && decoder)
		return decoder.decode(src.subarray(position$1, position$1 += length))
	const end = position$1 + length;
	const units = [];
	result = '';
	while (position$1 < end) {
		const byte1 = src[position$1++];
		if ((byte1 & 0x80) === 0) {
			// 1 byte
			units.push(byte1);
		} else if ((byte1 & 0xe0) === 0xc0) {
			// 2 bytes
			const byte2 = src[position$1++] & 0x3f;
			const codePoint = ((byte1 & 0x1f) << 6) | byte2;
			// Reject overlong encoding: 2-byte sequences must encode values >= 0x80
			if (codePoint < 0x80) {
				units.push(0xFFFD); // replacement character
			} else {
				units.push(codePoint);
			}
		} else if ((byte1 & 0xf0) === 0xe0) {
			// 3 bytes
			const byte2 = src[position$1++] & 0x3f;
			const byte3 = src[position$1++] & 0x3f;
			const codePoint = ((byte1 & 0x1f) << 12) | (byte2 << 6) | byte3;
			// Reject overlong encoding: 3-byte sequences must encode values >= 0x800
			// Also reject surrogates (0xD800-0xDFFF)
			if (codePoint < 0x800 || (codePoint >= 0xD800 && codePoint <= 0xDFFF)) {
				units.push(0xFFFD); // replacement character
			} else {
				units.push(codePoint);
			}
		} else if ((byte1 & 0xf8) === 0xf0) {
			// 4 bytes
			const byte2 = src[position$1++] & 0x3f;
			const byte3 = src[position$1++] & 0x3f;
			const byte4 = src[position$1++] & 0x3f;
			let unit = ((byte1 & 0x07) << 0x12) | (byte2 << 0x0c) | (byte3 << 0x06) | byte4;
			// Reject overlong encoding: 4-byte sequences must encode values >= 0x10000
			// Also reject values > 0x10FFFF (maximum valid Unicode)
			if (unit < 0x10000 || unit > 0x10FFFF) {
				units.push(0xFFFD); // replacement character
			} else if (unit > 0xffff) {
				unit -= 0x10000;
				units.push(((unit >>> 10) & 0x3ff) | 0xd800);
				unit = 0xdc00 | (unit & 0x3ff);
				units.push(unit);
			} else {
				units.push(unit);
			}
		} else {
			units.push(0xFFFD); // replacement character for invalid lead byte
		}

		if (units.length >= 0x1000) {
			result += fromCharCode.apply(String, units);
			units.length = 0;
		}
	}

	if (units.length > 0) {
		result += fromCharCode.apply(String, units);
	}

	return result
}
let fromCharCode = String.fromCharCode;
function longStringInJS(length) {
	let start = position$1;
	let bytes = new Array(length);
	for (let i = 0; i < length; i++) {
		const byte = src[position$1++];
		if ((byte & 0x80) > 0) {
			position$1 = start;
    			return
    		}
    		bytes[i] = byte;
    	}
    	return fromCharCode.apply(String, bytes)
}
function shortStringInJS(length) {
	if (length < 4) {
		if (length < 2) {
			if (length === 0)
				return ''
			else {
				let a = src[position$1++];
				if ((a & 0x80) > 1) {
					position$1 -= 1;
					return
				}
				return fromCharCode(a)
			}
		} else {
			let a = src[position$1++];
			let b = src[position$1++];
			if ((a & 0x80) > 0 || (b & 0x80) > 0) {
				position$1 -= 2;
				return
			}
			if (length < 3)
				return fromCharCode(a, b)
			let c = src[position$1++];
			if ((c & 0x80) > 0) {
				position$1 -= 3;
				return
			}
			return fromCharCode(a, b, c)
		}
	} else {
		let a = src[position$1++];
		let b = src[position$1++];
		let c = src[position$1++];
		let d = src[position$1++];
		if ((a & 0x80) > 0 || (b & 0x80) > 0 || (c & 0x80) > 0 || (d & 0x80) > 0) {
			position$1 -= 4;
			return
		}
		if (length < 6) {
			if (length === 4)
				return fromCharCode(a, b, c, d)
			else {
				let e = src[position$1++];
				if ((e & 0x80) > 0) {
					position$1 -= 5;
					return
				}
				return fromCharCode(a, b, c, d, e)
			}
		} else if (length < 8) {
			let e = src[position$1++];
			let f = src[position$1++];
			if ((e & 0x80) > 0 || (f & 0x80) > 0) {
				position$1 -= 6;
				return
			}
			if (length < 7)
				return fromCharCode(a, b, c, d, e, f)
			let g = src[position$1++];
			if ((g & 0x80) > 0) {
				position$1 -= 7;
				return
			}
			return fromCharCode(a, b, c, d, e, f, g)
		} else {
			let e = src[position$1++];
			let f = src[position$1++];
			let g = src[position$1++];
			let h = src[position$1++];
			if ((e & 0x80) > 0 || (f & 0x80) > 0 || (g & 0x80) > 0 || (h & 0x80) > 0) {
				position$1 -= 8;
				return
			}
			if (length < 10) {
				if (length === 8)
					return fromCharCode(a, b, c, d, e, f, g, h)
				else {
					let i = src[position$1++];
					if ((i & 0x80) > 0) {
						position$1 -= 9;
						return
					}
					return fromCharCode(a, b, c, d, e, f, g, h, i)
				}
			} else if (length < 12) {
				let i = src[position$1++];
				let j = src[position$1++];
				if ((i & 0x80) > 0 || (j & 0x80) > 0) {
					position$1 -= 10;
					return
				}
				if (length < 11)
					return fromCharCode(a, b, c, d, e, f, g, h, i, j)
				let k = src[position$1++];
				if ((k & 0x80) > 0) {
					position$1 -= 11;
					return
				}
				return fromCharCode(a, b, c, d, e, f, g, h, i, j, k)
			} else {
				let i = src[position$1++];
				let j = src[position$1++];
				let k = src[position$1++];
				let l = src[position$1++];
				if ((i & 0x80) > 0 || (j & 0x80) > 0 || (k & 0x80) > 0 || (l & 0x80) > 0) {
					position$1 -= 12;
					return
				}
				if (length < 14) {
					if (length === 12)
						return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l)
					else {
						let m = src[position$1++];
						if ((m & 0x80) > 0) {
							position$1 -= 13;
							return
						}
						return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m)
					}
				} else {
					let m = src[position$1++];
					let n = src[position$1++];
					if ((m & 0x80) > 0 || (n & 0x80) > 0) {
						position$1 -= 14;
						return
					}
					if (length < 15)
						return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m, n)
					let o = src[position$1++];
					if ((o & 0x80) > 0) {
						position$1 -= 15;
						return
					}
					return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
				}
			}
		}
	}
}

function readBin(length) {
	return currentDecoder.copyBuffers ?
		// specifically use the copying slice (not the node one)
		Uint8Array.prototype.slice.call(src, position$1, position$1 += length) :
		src.subarray(position$1, position$1 += length)
}
let f32Array = new Float32Array(1);
let u8Array = new Uint8Array(f32Array.buffer, 0, 4);
function getFloat16() {
	let byte0 = src[position$1++];
	let byte1 = src[position$1++];
	let exponent = (byte0 & 0x7f) >> 2;
	if (exponent === 0x1f) { // specials
		if (byte1 || (byte0 & 3))
			return NaN;
		return (byte0 & 0x80) ? -Infinity : Infinity;
	}
	if (exponent === 0) { // sub-normals
		// significand with 10 fractional bits and divided by 2^14
		let abs = (((byte0 & 3) << 8) | byte1) / (1 << 24);
		return (byte0 & 0x80) ? -abs : abs
	}

	u8Array[3] = (byte0 & 0x80) | // sign bit
		((exponent >> 1) + 56); // 4 of 5 of the exponent bits, re-offset-ed
	u8Array[2] = ((byte0 & 7) << 5) | // last exponent bit and first two mantissa bits
		(byte1 >> 3); // next 5 bits of mantissa
	u8Array[1] = byte1 << 5; // last three bits of mantissa
	u8Array[0] = 0;
	return f32Array[0];
}

new Array(4096);

class Tag {
	constructor(value, tag) {
		this.value = value;
		this.tag = tag;
	}
}

currentExtensions[0] = (dateString) => {
	// string date extension
	return new Date(dateString)
};

currentExtensions[1] = (epochSec) => {
	// numeric date extension
	return new Date(Math.round(epochSec * 1000))
};

currentExtensions[2] = (buffer) => {
	// bigint extension
	let value = BigInt(0);
	for (let i = 0, l = buffer.byteLength; i < l; i++) {
		value = BigInt(buffer[i]) + (value << BigInt(8));
	}
	return value
};

currentExtensions[3] = (buffer) => {
	// negative bigint extension
	return BigInt(-1) - currentExtensions[2](buffer)
};
currentExtensions[4] = (fraction) => {
	// best to reparse to maintain accuracy
	return +(fraction[1] + 'e' + fraction[0])
};

currentExtensions[5] = (fraction) => {
	// probably not sufficiently accurate
	return fraction[1] * Math.exp(fraction[0] * Math.log(2))
};

// the registration of the record definition extension
const recordDefinition = (id, structure) => {
	id = id - 0xe000;
	let existingStructure = currentStructures[id];
	if (existingStructure && existingStructure.isShared) {
		(currentStructures.restoreStructures || (currentStructures.restoreStructures = []))[id] = existingStructure;
	}
	currentStructures[id] = structure;

	structure.read = createStructureReader(structure);
};
currentExtensions[LEGACY_RECORD_INLINE_ID] = (data) => {
	let length = data.length;
	let structure = data[1];
	recordDefinition(data[0], structure);
	let object = {};
	for (let i = 2; i < length; i++) {
		let key = structure[i - 2];
		object[safeKey(key)] = data[i];
	}
	return object
};
currentExtensions[14] = (value) => {
	if (bundledStrings$1)
		return bundledStrings$1[0].slice(bundledStrings$1.position0, bundledStrings$1.position0 += value)
	return new Tag(value, 14)
};
currentExtensions[15] = (value) => {
	if (bundledStrings$1)
		return bundledStrings$1[1].slice(bundledStrings$1.position1, bundledStrings$1.position1 += value)
	return new Tag(value, 15)
};
let glbl = { Error, RegExp };
currentExtensions[27] = (data) => { // http://cbor.schmorp.de/generic-object
	return (glbl[data[0]] || Error)(data[1], data[2])
};
const packedTable = (read) => {
	if (src[position$1++] != 0x84) {
		let error = new Error('Packed values structure must be followed by a 4 element array');
		if (src.length < position$1)
			error.incomplete = true;
		throw error
	}
	let newPackedValues = read(); // packed values
	if (!newPackedValues || !newPackedValues.length) {
		let error = new Error('Packed values structure must be followed by a 4 element array');
		error.incomplete = true;
		throw error
	}
	packedValues = packedValues ? newPackedValues.concat(packedValues.slice(newPackedValues.length)) : newPackedValues;
	packedValues.prefixes = read();
	packedValues.suffixes = read();
	return read() // read the rump
};
packedTable.handlesRead = true;
currentExtensions[51] = packedTable;

currentExtensions[PACKED_REFERENCE_TAG_ID] = (data) => { // packed reference
	if (!packedValues) {
		if (currentDecoder.getShared)
			loadShared();
		else
			return new Tag(data, PACKED_REFERENCE_TAG_ID)
	}
	if (typeof data == 'number')
		return packedValues[16 + (data >= 0 ? 2 * data : (-2 * data - 1))]
	let error = new Error('No support for non-integer packed references yet');
	if (data === undefined)
		error.incomplete = true;
	throw error
};

// The following code is an incomplete implementation of http://cbor.schmorp.de/stringref
// the real thing would need to implemennt more logic to populate the stringRefs table and
// maintain a stack of stringRef "namespaces".
//
// currentExtensions[25] = (id) => {
// 	return stringRefs[id]
// }
// currentExtensions[256] = (read) => {
// 	stringRefs = []
// 	try {
// 		return read()
// 	} finally {
// 		stringRefs = null
// 	}
// }
// currentExtensions[256].handlesRead = true

currentExtensions[28] = (read) => { 
	// shareable http://cbor.schmorp.de/value-sharing (for structured clones)
	if (!referenceMap) {
		referenceMap = new Map();
		referenceMap.id = 0;
	}
	let id = referenceMap.id++;
	let startingPosition = position$1;
	let token = src[position$1];
	let target;
	// TODO: handle Maps, Sets, and other types that can cycle; this is complicated, because you potentially need to read
	// ahead past references to record structure definitions
	if ((token >> 5) == 4)
		target = [];
	else
		target = {};

	let refEntry = { target }; // a placeholder object
	referenceMap.set(id, refEntry);
	let targetProperties = read(); // read the next value as the target object to id
	if (refEntry.used) {// there is a cycle, so we have to assign properties to original target
		if (Object.getPrototypeOf(target) !== Object.getPrototypeOf(targetProperties)) {
			// this means that the returned target does not match the targetProperties, so we need rerun the read to
			// have the correctly create instance be assigned as a reference, then we do the copy the properties back to the
			// target
			// reset the position so that the read can be repeated
			position$1 = startingPosition;
			// the returned instance is our new target for references
			target = targetProperties;
			referenceMap.set(id, { target });
			targetProperties = read();
		}
		return Object.assign(target, targetProperties)
	}
	refEntry.target = targetProperties; // the placeholder wasn't used, replace with the deserialized one
	return targetProperties // no cycle, can just use the returned read object
};
currentExtensions[28].handlesRead = true;

currentExtensions[29] = (id) => {
	// sharedref http://cbor.schmorp.de/value-sharing (for structured clones)
	let refEntry = referenceMap.get(id);
	refEntry.used = true;
	return refEntry.target
};

currentExtensions[258] = (array) => new Set(array); // https://github.com/input-output-hk/cbor-sets-spec/blob/master/CBOR_SETS.md
(currentExtensions[259] = (read) => {
	// https://github.com/shanewholloway/js-cbor-codec/blob/master/docs/CBOR-259-spec
	// for decoding as a standard Map
	if (currentDecoder.mapsAsObjects) {
		currentDecoder.mapsAsObjects = false;
		restoreMapsAsObject = true;
	}
	return read()
}).handlesRead = true;
function combine(a, b) {
	if (typeof a === 'string')
		return a + b
	if (a instanceof Array)
		return a.concat(b)
	return Object.assign({}, a, b)
}
function getPackedValues() {
	if (!packedValues) {
		if (currentDecoder.getShared)
			loadShared();
		else
			throw new Error('No packed values available')
	}
	return packedValues
}
const SHARED_DATA_TAG_ID = 0x53687264; // ascii 'Shrd'
currentExtensionRanges.push((tag, input) => {
	if (tag >= 225 && tag <= 255)
		return combine(getPackedValues().prefixes[tag - 224], input)
	if (tag >= 28704 && tag <= 32767)
		return combine(getPackedValues().prefixes[tag - 28672], input)
	if (tag >= 1879052288 && tag <= 2147483647)
		return combine(getPackedValues().prefixes[tag - 1879048192], input)
	if (tag >= 216 && tag <= 223)
		return combine(input, getPackedValues().suffixes[tag - 216])
	if (tag >= 27647 && tag <= 28671)
		return combine(input, getPackedValues().suffixes[tag - 27639])
	if (tag >= 1811940352 && tag <= 1879048191)
		return combine(input, getPackedValues().suffixes[tag - 1811939328])
	if (tag == SHARED_DATA_TAG_ID) {// we do a special check for this so that we can keep the currentExtensions as densely stored array (v8 stores arrays densely under about 3000 elements)
		return {
			packedValues: packedValues,
			structures: currentStructures.slice(0),
			version: input,
		}
	}
	if (tag == 55799) // self-descriptive CBOR tag, just return input value
		return input
});

const isLittleEndianMachine$1 = new Uint8Array(new Uint16Array([1]).buffer)[0] == 1;
const typedArrays = [Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array,
	typeof BigUint64Array == 'undefined' ? { name:'BigUint64Array' } : BigUint64Array, Int8Array, Int16Array, Int32Array,
	typeof BigInt64Array == 'undefined' ? { name:'BigInt64Array' } : BigInt64Array, Float32Array, Float64Array];
const typedArrayTags = [64, 68, 69, 70, 71, 72, 77, 78, 79, 85, 86];
for (let i = 0; i < typedArrays.length; i++) {
	registerTypedArray(typedArrays[i], typedArrayTags[i]);
}
function registerTypedArray(TypedArray, tag) {
	let dvMethod = 'get' + TypedArray.name.slice(0, -5);
	let bytesPerElement;
	if (typeof TypedArray === 'function')
		bytesPerElement = TypedArray.BYTES_PER_ELEMENT;
	else
		TypedArray = null;
	for (let littleEndian = 0; littleEndian < 2; littleEndian++) {
		if (!littleEndian && bytesPerElement == 1)
			continue
		let sizeShift = bytesPerElement == 2 ? 1 : bytesPerElement == 4 ? 2 : bytesPerElement == 8 ? 3 : 0;
		currentExtensions[littleEndian ? tag : (tag - 4)] = (bytesPerElement == 1 || littleEndian == isLittleEndianMachine$1) ? (buffer) => {
			if (!TypedArray)
				throw new Error('Could not find typed array for code ' + tag)
			if (!currentDecoder.copyBuffers) {
				// try provide a direct view, but will only work if we are byte-aligned
				if (bytesPerElement === 1 ||
					bytesPerElement === 2 && !(buffer.byteOffset & 1) ||
					bytesPerElement === 4 && !(buffer.byteOffset & 3) ||
					bytesPerElement === 8 && !(buffer.byteOffset & 7))
					return new TypedArray(buffer.buffer, buffer.byteOffset, buffer.byteLength >> sizeShift);
			}
			// we have to slice/copy here to get a new ArrayBuffer, if we are not word/byte aligned
			return new TypedArray(Uint8Array.prototype.slice.call(buffer, 0).buffer)
		} : buffer => {
			if (!TypedArray)
				throw new Error('Could not find typed array for code ' + tag)
			let dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
			let elements = buffer.length >> sizeShift;
			let ta = new TypedArray(elements);
			let method = dv[dvMethod];
			for (let i = 0; i < elements; i++) {
				ta[i] = method.call(dv, i << sizeShift, littleEndian);
			}
			return ta
		};
	}
}

function readBundleExt() {
	let length = readJustLength();
	let bundlePosition = position$1 + read();
	for (let i = 2; i < length; i++) {
		// skip past bundles that were already read
		let bundleLength = readJustLength(); // this will increment position, so must add to position afterwards
		position$1 += bundleLength;
	}
	let dataPosition = position$1;
	position$1 = bundlePosition;
	bundledStrings$1 = [readStringJS(readJustLength()), readStringJS(readJustLength())];
	bundledStrings$1.position0 = 0;
	bundledStrings$1.position1 = 0;
	bundledStrings$1.postBundlePosition = position$1;
	position$1 = dataPosition;
	return read()
}

function readJustLength() {
	let token = src[position$1++] & 0x1f;
	if (token > 0x17) {
		switch (token) {
			case 0x18:
				token = src[position$1++];
				break
			case 0x19:
				token = dataView$1.getUint16(position$1);
				position$1 += 2;
				break
			case 0x1a:
				token = dataView$1.getUint32(position$1);
				position$1 += 4;
				break
		}
	}
	return token
}

function loadShared() {
	if (currentDecoder.getShared) {
		let sharedData = saveState(() => {
			// save the state in case getShared modifies our buffer
			src = null;
			return currentDecoder.getShared()
		}) || {};
		let updatedStructures = sharedData.structures || [];
		currentDecoder.sharedVersion = sharedData.version;
		packedValues = currentDecoder.sharedValues = sharedData.packedValues;
		if (currentStructures === true)
			currentDecoder.structures = currentStructures = updatedStructures;
		else
			currentStructures.splice.apply(currentStructures, [0, updatedStructures.length].concat(updatedStructures));
	}
}

function saveState(callback) {
	let savedSrcEnd = srcEnd;
	let savedPosition = position$1;
	let savedSrcStringStart = srcStringStart;
	let savedSrcStringEnd = srcStringEnd;
	let savedSrcString = srcString;
	let savedReferenceMap = referenceMap;
	let savedBundledStrings = bundledStrings$1;

	// TODO: We may need to revisit this if we do more external calls to user code (since it could be slow)
	let savedSrc = new Uint8Array(src.slice(0, srcEnd)); // we copy the data in case it changes while external data is processed
	let savedStructures = currentStructures;
	let savedDecoder = currentDecoder;
	let savedSequentialMode = sequentialMode;
	let value = callback();
	srcEnd = savedSrcEnd;
	position$1 = savedPosition;
	srcStringStart = savedSrcStringStart;
	srcStringEnd = savedSrcStringEnd;
	srcString = savedSrcString;
	referenceMap = savedReferenceMap;
	bundledStrings$1 = savedBundledStrings;
	src = savedSrc;
	sequentialMode = savedSequentialMode;
	currentStructures = savedStructures;
	currentDecoder = savedDecoder;
	dataView$1 = new DataView(src.buffer, src.byteOffset, src.byteLength);
	return value
}
function clearSource() {
	src = null;
	referenceMap = null;
	currentStructures = null;
}

const mult10 = new Array(147); // this is a table matching binary exponents to the multiplier to determine significant digit rounding
for (let i = 0; i < 256; i++) {
	mult10[i] = +('1e' + Math.floor(45.15 - i * 0.30103));
}
let defaultDecoder = new Decoder({ useRecords: false });
defaultDecoder.decode;
defaultDecoder.decodeMultiple;

let textEncoder$3;
try {
	textEncoder$3 = new TextEncoder();
} catch (error) {}
let extensions, extensionClasses;
const Buffer = typeof globalThis === 'object' && globalThis.Buffer;
const hasNodeBuffer = typeof Buffer !== 'undefined';
const ByteArrayAllocate = hasNodeBuffer ? Buffer.allocUnsafeSlow : Uint8Array;
const ByteArray = hasNodeBuffer ? Buffer : Uint8Array;
const MAX_STRUCTURES = 0x100;
const MAX_BUFFER_SIZE = hasNodeBuffer ? 0x100000000 : 0x7fd00000;
let throwOnIterable;
let target;
let targetView;
let position = 0;
let safeEnd;
let bundledStrings = null;
const MAX_BUNDLE_SIZE = 0xf000;
const hasNonLatin = /[\u0080-\uFFFF]/;
const RECORD_SYMBOL = Symbol('record-id');
class Encoder extends Decoder {
	constructor(options) {
		super(options);
		this.offset = 0;
		let start;
		let sharedStructures;
		let hasSharedUpdate;
		let structures;
		let referenceMap;
		options = options || {};
		let encodeUtf8 = ByteArray.prototype.utf8Write ? function(string, position) {
			return target.utf8Write(string, position, target.byteLength - position)
		} : (textEncoder$3 && textEncoder$3.encodeInto) ?
			function(string, position) {
				return textEncoder$3.encodeInto(string, target.subarray(position)).written
			} : false;

		let encoder = this;
		let hasSharedStructures = options.structures || options.saveStructures;
		let maxSharedStructures = options.maxSharedStructures;
		if (maxSharedStructures == null)
			maxSharedStructures = hasSharedStructures ? 128 : 0;
		if (maxSharedStructures > 8190)
			throw new Error('Maximum maxSharedStructure is 8190')
		let isSequential = options.sequential;
		if (isSequential) {
			maxSharedStructures = 0;
		}
		if (!this.structures)
			this.structures = [];
		if (this.saveStructures)
			this.saveShared = this.saveStructures;
		let samplingPackedValues, packedObjectMap, sharedValues = options.sharedValues;
		let sharedPackedObjectMap;
		if (sharedValues) {
			sharedPackedObjectMap = Object.create(null);
			for (let i = 0, l = sharedValues.length; i < l; i++) {
				sharedPackedObjectMap[sharedValues[i]] = i;
			}
		}
		let recordIdsToRemove = [];
		let transitionsCount = 0;
		let serializationsSinceTransitionRebuild = 0;
		
		this.mapEncode = function(value, encodeOptions) {
			// Experimental support for premapping keys using _keyMap instad of keyMap - not optiimised yet)
			if (this._keyMap && !this._mapped) {
				//console.log('encoding ', value)
				switch (value.constructor.name) {
					case 'Array': 
						value = value.map(r => this.encodeKeys(r));
						break
					//case 'Map': 
					//	value = this.encodeKeys(value)
					//	break
				}
				//this._mapped = true
			}
			return this.encode(value, encodeOptions)
		};
		
		this.encode = function(value, encodeOptions)	{
			if (!target) {
				target = new ByteArrayAllocate(8192);
				targetView = new DataView(target.buffer, 0, 8192);
				position = 0;
			}
			safeEnd = target.length - 10;
			if (safeEnd - position < 0x800) {
				// don't start too close to the end, 
				target = new ByteArrayAllocate(target.length);
				targetView = new DataView(target.buffer, 0, target.length);
				safeEnd = target.length - 10;
				position = 0;
			} else if (encodeOptions === REUSE_BUFFER_MODE)
				position = (position + 7) & 0x7ffffff8; // Word align to make any future copying of this buffer faster
			start = position;
			if (encoder.useSelfDescribedHeader) {
				targetView.setUint32(position, 0xd9d9f700); // tag two byte, then self-descriptive tag
				position += 3;
			}
			referenceMap = encoder.structuredClone ? new Map() : null;
			if (encoder.bundleStrings && typeof value !== 'string') {
				bundledStrings = [];
				bundledStrings.size = Infinity; // force a new bundle start on first string
			} else
				bundledStrings = null;

			sharedStructures = encoder.structures;
			if (sharedStructures) {
				if (sharedStructures.uninitialized) {
					let sharedData = encoder.getShared() || {};
					encoder.structures = sharedStructures = sharedData.structures || [];
					encoder.sharedVersion = sharedData.version;
					let sharedValues = encoder.sharedValues = sharedData.packedValues;
					if (sharedValues) {
						sharedPackedObjectMap = {};
						for (let i = 0, l = sharedValues.length; i < l; i++)
							sharedPackedObjectMap[sharedValues[i]] = i;
					}
				}
				let sharedStructuresLength = sharedStructures.length;
				if (sharedStructuresLength > maxSharedStructures && !isSequential)
					sharedStructuresLength = maxSharedStructures;
				if (!sharedStructures.transitions) {
					// rebuild our structure transitions
					sharedStructures.transitions = Object.create(null);
					for (let i = 0; i < sharedStructuresLength; i++) {
						let keys = sharedStructures[i];
						//console.log('shared struct keys:', keys)
						if (!keys)
							continue
						let nextTransition, transition = sharedStructures.transitions;
						for (let j = 0, l = keys.length; j < l; j++) {
							if (transition[RECORD_SYMBOL] === undefined)
								transition[RECORD_SYMBOL] = i;
							let key = keys[j];
							nextTransition = transition[key];
							if (!nextTransition) {
								nextTransition = transition[key] = Object.create(null);
							}
							transition = nextTransition;
						}
						transition[RECORD_SYMBOL] = i | 0x100000;
					}
				}
				if (!isSequential)
					sharedStructures.nextId = sharedStructuresLength;
			}
			if (hasSharedUpdate)
				hasSharedUpdate = false;
			structures = sharedStructures || [];
			packedObjectMap = sharedPackedObjectMap;
			if (options.pack) {
				let packedValues = new Map();
				packedValues.values = [];
				packedValues.encoder = encoder;
				packedValues.maxValues = options.maxPrivatePackedValues || (sharedPackedObjectMap ? 16 : Infinity);
				packedValues.objectMap = sharedPackedObjectMap || false;
				packedValues.samplingPackedValues = samplingPackedValues;
				findRepetitiveStrings(value, packedValues);
				if (packedValues.values.length > 0) {
					target[position++] = 0xd8; // one-byte tag
					target[position++] = 51; // tag 51 for packed shared structures https://www.potaroo.net/ietf/ids/draft-ietf-cbor-packed-03.txt
					writeArrayHeader(4);
					let valuesArray = packedValues.values;
					encode(valuesArray);
					writeArrayHeader(0); // prefixes
					writeArrayHeader(0); // suffixes
					packedObjectMap = Object.create(sharedPackedObjectMap || null);
					for (let i = 0, l = valuesArray.length; i < l; i++) {
						packedObjectMap[valuesArray[i]] = i;
					}
				}
			}
			throwOnIterable = encodeOptions & THROW_ON_ITERABLE;
			try {
				if (throwOnIterable)
					return;
				encode(value);
				if (bundledStrings) {
					writeBundles(start, encode);
				}
				encoder.offset = position; // update the offset so next serialization doesn't write over our buffer, but can continue writing to same buffer sequentially
				if (referenceMap && referenceMap.idsToInsert) {
					position += referenceMap.idsToInsert.length * 2;
					if (position > safeEnd)
						makeRoom(position);
					encoder.offset = position;
					let serialized = insertIds(target.subarray(start, position), referenceMap.idsToInsert);
					referenceMap = null;
					return serialized
				}
				if (encodeOptions & REUSE_BUFFER_MODE) {
					target.start = start;
					target.end = position;
					return target
				}
				return target.subarray(start, position) // position can change if we call encode again in saveShared, so we get the buffer now
			} finally {
				if (sharedStructures) {
					if (serializationsSinceTransitionRebuild < 10)
						serializationsSinceTransitionRebuild++;
					if (sharedStructures.length > maxSharedStructures)
						sharedStructures.length = maxSharedStructures;
					if (transitionsCount > 10000) {
						// force a rebuild occasionally after a lot of transitions so it can get cleaned up
						sharedStructures.transitions = null;
						serializationsSinceTransitionRebuild = 0;
						transitionsCount = 0;
						if (recordIdsToRemove.length > 0)
							recordIdsToRemove = [];
					} else if (recordIdsToRemove.length > 0 && !isSequential) {
						for (let i = 0, l = recordIdsToRemove.length; i < l; i++) {
							recordIdsToRemove[i][RECORD_SYMBOL] = undefined;
						}
						recordIdsToRemove = [];
						//sharedStructures.nextId = maxSharedStructures
					}
				}
				if (hasSharedUpdate && encoder.saveShared) {
					if (encoder.structures.length > maxSharedStructures) {
						encoder.structures = encoder.structures.slice(0, maxSharedStructures);
					}
					// we can't rely on start/end with REUSE_BUFFER_MODE since they will (probably) change when we save
					let returnBuffer = target.subarray(start, position);
					if (encoder.updateSharedData() === false)
						return encoder.encode(value) // re-encode if it fails
					return returnBuffer
				}
				if (encodeOptions & RESET_BUFFER_MODE)
					position = start;
			}
		};
		this.findCommonStringsToPack = () => {
			samplingPackedValues = new Map();
			if (!sharedPackedObjectMap)
				sharedPackedObjectMap = Object.create(null);
			return (options) => {
				let threshold = options && options.threshold || 4;
				let position = this.pack ? options.maxPrivatePackedValues || 16 : 0;
				if (!sharedValues)
					sharedValues = this.sharedValues = [];
				for (let [ key, status ] of samplingPackedValues) {
					if (status.count > threshold) {
						sharedPackedObjectMap[key] = position++;
						sharedValues.push(key);
						hasSharedUpdate = true;
					}
				}
				while (this.saveShared && this.updateSharedData() === false) {}
				samplingPackedValues = null;
			}
		};
		const encode = (value) => {
			if (position > safeEnd)
				target = makeRoom(position);

			var type = typeof value;
			var length;
			if (type === 'string') {
				if (packedObjectMap) {
					let packedPosition = packedObjectMap[value];
					if (packedPosition >= 0) {
						if (packedPosition < 16)
							target[position++] = packedPosition + 0xe0; // simple values, defined in https://www.potaroo.net/ietf/ids/draft-ietf-cbor-packed-03.txt
						else {
							target[position++] = 0xc6; // tag 6 defined in https://www.potaroo.net/ietf/ids/draft-ietf-cbor-packed-03.txt
							if (packedPosition & 1)
								encode((15 - packedPosition) >> 1);
							else
								encode((packedPosition - 16) >> 1);
						}
						return
/*						} else if (packedStatus.serializationId != serializationId) {
							packedStatus.serializationId = serializationId
							packedStatus.count = 1
							if (options.sharedPack) {
								let sharedCount = packedStatus.sharedCount = (packedStatus.sharedCount || 0) + 1
								if (shareCount > (options.sharedPack.threshold || 5)) {
									let sharedPosition = packedStatus.position = packedStatus.nextSharedPosition
									hasSharedUpdate = true
									if (sharedPosition < 16)
										target[position++] = sharedPosition + 0xc0

								}
							}
						} // else any in-doc incrementation?*/
					} else if (samplingPackedValues && !options.pack) {
						let status = samplingPackedValues.get(value);
						if (status)
							status.count++;
						else
							samplingPackedValues.set(value, {
								count: 1,
							});
					}
				}
				let strLength = value.length;
				if (bundledStrings && strLength >= 4 && strLength < 0x400) {
					if ((bundledStrings.size += strLength) > MAX_BUNDLE_SIZE) {
						let extStart;
						let maxBytes = (bundledStrings[0] ? bundledStrings[0].length * 3 + bundledStrings[1].length : 0) + 10;
						if (position + maxBytes > safeEnd)
							target = makeRoom(position + maxBytes);
						target[position++] = 0xd9; // tag 16-bit
						target[position++] = 0xdf; // tag 0xdff9
						target[position++] = 0xf9;
						// TODO: If we only have one bundle with any string data, only write one string bundle
						target[position++] = bundledStrings.position ? 0x84 : 0x82; // array of 4 or 2 elements depending on if we write bundles
						target[position++] = 0x1a; // 32-bit unsigned int
						extStart = position - start;
						position += 4; // reserve for writing bundle reference
						if (bundledStrings.position) {
							writeBundles(start, encode); // write the last bundles
						}
						bundledStrings = ['', '']; // create new ones
						bundledStrings.size = 0;
						bundledStrings.position = extStart;
					}
					let twoByte = hasNonLatin.test(value);
					bundledStrings[twoByte ? 0 : 1] += value;
					target[position++] = twoByte ? 0xce : 0xcf;
					encode(strLength);
					return
				}
				let headerSize;
				// first we estimate the header size, so we can write to the correct location
				if (strLength < 0x20) {
					headerSize = 1;
				} else if (strLength < 0x100) {
					headerSize = 2;
				} else if (strLength < 0x10000) {
					headerSize = 3;
				} else {
					headerSize = 5;
				}
				let maxBytes = strLength * 3;
				if (position + maxBytes > safeEnd)
					target = makeRoom(position + maxBytes);

				if (strLength < 0x40 || !encodeUtf8) {
					let i, c1, c2, strPosition = position + headerSize;
					for (i = 0; i < strLength; i++) {
						c1 = value.charCodeAt(i);
						if (c1 < 0x80) {
							target[strPosition++] = c1;
						} else if (c1 < 0x800) {
							target[strPosition++] = c1 >> 6 | 0xc0;
							target[strPosition++] = c1 & 0x3f | 0x80;
						} else if (
							(c1 & 0xfc00) === 0xd800 &&
							((c2 = value.charCodeAt(i + 1)) & 0xfc00) === 0xdc00
						) {
							c1 = 0x10000 + ((c1 & 0x03ff) << 10) + (c2 & 0x03ff);
							i++;
							target[strPosition++] = c1 >> 18 | 0xf0;
							target[strPosition++] = c1 >> 12 & 0x3f | 0x80;
							target[strPosition++] = c1 >> 6 & 0x3f | 0x80;
							target[strPosition++] = c1 & 0x3f | 0x80;
						} else {
							target[strPosition++] = c1 >> 12 | 0xe0;
							target[strPosition++] = c1 >> 6 & 0x3f | 0x80;
							target[strPosition++] = c1 & 0x3f | 0x80;
						}
					}
					length = strPosition - position - headerSize;
				} else {
					length = encodeUtf8(value, position + headerSize, maxBytes);
				}

				if (length < 0x18) {
					target[position++] = 0x60 | length;
				} else if (length < 0x100) {
					if (headerSize < 2) {
						target.copyWithin(position + 2, position + 1, position + 1 + length);
					}
					target[position++] = 0x78;
					target[position++] = length;
				} else if (length < 0x10000) {
					if (headerSize < 3) {
						target.copyWithin(position + 3, position + 2, position + 2 + length);
					}
					target[position++] = 0x79;
					target[position++] = length >> 8;
					target[position++] = length & 0xff;
				} else {
					if (headerSize < 5) {
						target.copyWithin(position + 5, position + 3, position + 3 + length);
					}
					target[position++] = 0x7a;
					targetView.setUint32(position, length);
					position += 4;
				}
				position += length;
			} else if (type === 'number') {
				if (!this.alwaysUseFloat && value >>> 0 === value) {// positive integer, 32-bit or less
					// positive uint
					if (value < 0x18) {
						target[position++] = value;
					} else if (value < 0x100) {
						target[position++] = 0x18;
						target[position++] = value;
					} else if (value < 0x10000) {
						target[position++] = 0x19;
						target[position++] = value >> 8;
						target[position++] = value & 0xff;
					} else {
						target[position++] = 0x1a;
						targetView.setUint32(position, value);
						position += 4;
					}
				} else if (!this.alwaysUseFloat && value >> 0 === value) { // negative integer, 31-bit or less
					if (value >= -24) {
						target[position++] = 0x1f - value;
					} else if (value >= -256) {
						target[position++] = 0x38;
						target[position++] = ~value;
					} else if (value >= -65536) {
						target[position++] = 0x39;
						targetView.setUint16(position, ~value);
						position += 2;
					} else {
						target[position++] = 0x3a;
						targetView.setUint32(position, ~value);
						position += 4;
					}
				} else if (!this.alwaysUseFloat && value < 0 && value >= -4294967296 && Math.floor(value) === value) {
					// negative integer, 32-bit or less
					target[position++] = 0x3a;
					targetView.setUint32(position, -1 - value);
					position += 4;
				} else {
					let useFloat32;
					if ((useFloat32 = this.useFloat32) > 0 && value < 0x100000000 && value >= -2147483648) {
						target[position++] = 0xfa;
						targetView.setFloat32(position, value);
						let xShifted;
						if (useFloat32 < 4 ||
								// this checks for rounding of numbers that were encoded in 32-bit float to nearest significant decimal digit that could be preserved
								((xShifted = value * mult10[((target[position] & 0x7f) << 1) | (target[position + 1] >> 7)]) >> 0) === xShifted) {
							position += 4;
							return
						} else
							position--; // move back into position for writing a double
					}
					target[position++] = 0xfb;
					targetView.setFloat64(position, value);
					position += 8;
				}
			} else if (type === 'object') {
				if (!value)
					target[position++] = 0xf6;
				else {
					if (referenceMap) {
						let referee = referenceMap.get(value);
						if (referee) {
							target[position++] = 0xd8;
							target[position++] = 29; // http://cbor.schmorp.de/value-sharing
							target[position++] = 0x19; // 16-bit uint
							if (!referee.references) {
								let idsToInsert = referenceMap.idsToInsert || (referenceMap.idsToInsert = []);
								referee.references = [];
								idsToInsert.push(referee);
							}
							referee.references.push(position - start);
							position += 2; // TODO: also support 32-bit
							return
						} else 
							referenceMap.set(value, { offset: position - start });
					}
					let constructor = value.constructor;
					if (constructor === Object) {
						if (this.skipFunction === true) {
							value = Object.fromEntries([...Object.keys(value).filter(x => typeof value[x] !== "function").map(x => [x, value[x]])]);
						}
						writeObject(value);
					} else if (constructor === Array) {
						length = value.length;
						if (length < 0x18) {
							target[position++] = 0x80 | length;
						} else {
							writeArrayHeader(length);
						}
						for (let i = 0; i < length; i++) {
							encode(value[i]);
						}
					} else if (constructor === Map) {
						if (this.mapsAsObjects ? this.useTag259ForMaps !== false : this.useTag259ForMaps) {
							// use Tag 259 (https://github.com/shanewholloway/js-cbor-codec/blob/master/docs/CBOR-259-spec--explicit-maps.md) for maps if the user wants it that way
							target[position++] = 0xd9;
							target[position++] = 1;
							target[position++] = 3;
						}
						length = value.size;
						if (length < 0x18) {
							target[position++] = 0xa0 | length;
						} else if (length < 0x100) {
							target[position++] = 0xb8;
							target[position++] = length;
						} else if (length < 0x10000) {
							target[position++] = 0xb9;
							target[position++] = length >> 8;
							target[position++] = length & 0xff;
						} else {
							target[position++] = 0xba;
							targetView.setUint32(position, length);
							position += 4;
						}
						if (encoder.keyMap) { 
							for (let [ key, entryValue ] of value) {
								encode(encoder.encodeKey(key));
								encode(entryValue);
							} 
						} else { 
							for (let [ key, entryValue ] of value) {
								encode(key); 
								encode(entryValue);
							} 	
						}
					} else {
						for (let i = 0, l = extensions.length; i < l; i++) {
							let extensionClass = extensionClasses[i];
							if (value instanceof extensionClass) {
								let extension = extensions[i];
								let tag = extension.tag;
								if (tag == undefined)
									tag = extension.getTag && extension.getTag.call(this, value);
								if (tag < 0x18) {
									target[position++] = 0xc0 | tag;
								} else if (tag < 0x100) {
									target[position++] = 0xd8;
									target[position++] = tag;
								} else if (tag < 0x10000) {
									target[position++] = 0xd9;
									target[position++] = tag >> 8;
									target[position++] = tag & 0xff;
								} else if (tag > -1) {
									target[position++] = 0xda;
									targetView.setUint32(position, tag);
									position += 4;
								} // else undefined, don't write tag
								extension.encode.call(this, value, encode, makeRoom);
								return
							}
						}
						if (value[Symbol.iterator]) {
							if (throwOnIterable) {
								let error = new Error('Iterable should be serialized as iterator');
								error.iteratorNotHandled = true;
								throw error;
							}
							target[position++] = 0x9f; // indefinite length array
							for (let entry of value) {
								encode(entry);
							}
							target[position++] = 0xff; // stop-code
							return
						}
						if (value[Symbol.asyncIterator] || isBlob(value)) {
							let error = new Error('Iterable/blob should be serialized as iterator');
							error.iteratorNotHandled = true;
							throw error;
						}
						if (this.useToJSON && value.toJSON) {
							const json = value.toJSON();
							// if for some reason value.toJSON returns itself it'll loop forever
							if (json !== value)
								return encode(json)
						}

						// no extension found, write as a plain object
						writeObject(value);
					}
				}
			} else if (type === 'boolean') {
				target[position++] = value ? 0xf5 : 0xf4;
			} else if (type === 'bigint') {
				if (value < (BigInt(1)<<BigInt(64)) && value >= 0) {
					// use an unsigned int as long as it fits
					target[position++] = 0x1b;
					targetView.setBigUint64(position, value);
				} else if (value > -(BigInt(1)<<BigInt(64)) && value < 0) {
					// if we can fit an unsigned int, use that
					target[position++] = 0x3b;
					targetView.setBigUint64(position, -value - BigInt(1));
				} else {
					// overflow
					if (this.largeBigIntToFloat) {
						target[position++] = 0xfb;
						targetView.setFloat64(position, Number(value));
					} else {
						if (value >= BigInt(0))
							target[position++] = 0xc2; // tag 2
						else {
							target[position++] = 0xc3; // tag 2
							value = BigInt(-1) - value;
						}
						let bytes = [];
						while (value) {
							bytes.push(Number(value & BigInt(0xff)));
							value >>= BigInt(8);
						}
						writeBuffer(new Uint8Array(bytes.reverse()), makeRoom);
						return;
					}
				}
				position += 8;
			} else if (type === 'undefined') {
				target[position++] = 0xf7;
			} else {
				throw new Error('Unknown type: ' + type)
			}
		};

		const writeObject = this.useRecords === false ? this.variableMapSize ? (object) => {
			// this method is slightly slower, but generates "preferred serialization" (optimally small for smaller objects)
			let keys = Object.keys(object);
			let vals = Object.values(object);
			let length = keys.length;
			if (length < 0x18) {
				target[position++] = 0xa0 | length;
			} else if (length < 0x100) {
				target[position++] = 0xb8;
				target[position++] = length;
			} else if (length < 0x10000) {
				target[position++] = 0xb9;
				target[position++] = length >> 8;
				target[position++] = length & 0xff;
			} else {
				target[position++] = 0xba;
				targetView.setUint32(position, length);
				position += 4;
			}
			if (encoder.keyMap) { 
				for (let i = 0; i < length; i++) {
					encode(encoder.encodeKey(keys[i]));
					encode(vals[i]);
				}
			} else {
				for (let i = 0; i < length; i++) {
					encode(keys[i]);
					encode(vals[i]);
				}
			}
		} :
		(object) => {
			target[position++] = 0xb9; // always use map 16, so we can preallocate and set the length afterwards
			let objectOffset = position - start;
			position += 2;
			let size = 0;
			if (encoder.keyMap) {
				for (let key in object) if (typeof object.hasOwnProperty !== 'function' || object.hasOwnProperty(key)) {
					encode(encoder.encodeKey(key));
					encode(object[key]);
					size++;
				}
			} else { 
				for (let key in object) if (typeof object.hasOwnProperty !== 'function' || object.hasOwnProperty(key)) {
						encode(key);
						encode(object[key]);
					size++;
				}
			}
			target[objectOffset++ + start] = size >> 8;
			target[objectOffset + start] = size & 0xff;
		} :
		(object, skipValues) => {
			let nextTransition, transition = structures.transitions || (structures.transitions = Object.create(null));
			let newTransitions = 0;
			let length = 0;
			let parentRecordId;
			let keys;
			if (this.keyMap) {
				keys = Object.keys(object).map(k => this.encodeKey(k));
				length = keys.length;
				for (let i = 0; i < length; i++) {
					let key = keys[i];
					nextTransition = transition[key];
					if (!nextTransition) {
						nextTransition = transition[key] = Object.create(null);
						newTransitions++;
					}
					transition = nextTransition;
				}				
			} else {
				for (let key in object) if (typeof object.hasOwnProperty !== 'function' || object.hasOwnProperty(key)) {
					nextTransition = transition[key];
					if (!nextTransition) {
						if (transition[RECORD_SYMBOL] & 0x100000) {// this indicates it is a brancheable/extendable terminal node, so we will use this record id and extend it
							parentRecordId = transition[RECORD_SYMBOL] & 0xffff;
						}
						nextTransition = transition[key] = Object.create(null);
						newTransitions++;
					}
					transition = nextTransition;
					length++;
				}
			}
			let recordId = transition[RECORD_SYMBOL];
			if (recordId !== undefined) {
				recordId &= 0xffff;
				target[position++] = 0xd9;
				target[position++] = (recordId >> 8) | 0xe0;
				target[position++] = recordId & 0xff;
			} else {
				if (!keys)
					keys = transition.__keys__ || (transition.__keys__ = Object.keys(object));
				if (parentRecordId === undefined) {
					recordId = structures.nextId++;
					if (!recordId) {
						recordId = 0;
						structures.nextId = 1;
					}
					if (recordId >= MAX_STRUCTURES) {// cycle back around
						structures.nextId = (recordId = maxSharedStructures) + 1;
					}
				} else {
					recordId = parentRecordId;
				}
				structures[recordId] = keys;
				if (recordId < maxSharedStructures) {
					target[position++] = 0xd9;
					target[position++] = (recordId >> 8) | 0xe0;
					target[position++] = recordId & 0xff;
					transition = structures.transitions;
					for (let i = 0; i < length; i++) {
						if (transition[RECORD_SYMBOL] === undefined || (transition[RECORD_SYMBOL] & 0x100000))
							transition[RECORD_SYMBOL] = recordId;
						transition = transition[keys[i]];
					}
					transition[RECORD_SYMBOL] = recordId | 0x100000; // indicates it is a extendable terminal
					hasSharedUpdate = true;
				} else {
					transition[RECORD_SYMBOL] = recordId;
					targetView.setUint32(position, 0xd9dfff00); // tag two byte, then record definition id
					position += 3;
					if (newTransitions)
						transitionsCount += serializationsSinceTransitionRebuild * newTransitions;
					// record the removal of the id, we can maintain our shared structure
					if (recordIdsToRemove.length >= MAX_STRUCTURES - maxSharedStructures)
						recordIdsToRemove.shift()[RECORD_SYMBOL] = undefined; // we are cycling back through, and have to remove old ones
					recordIdsToRemove.push(transition);
					writeArrayHeader(length + 2);
					encode(0xe000 + recordId);
					encode(keys);
					if (skipValues) return; // special exit for iterator
					for (let key in object)
						if (typeof object.hasOwnProperty !== 'function' || object.hasOwnProperty(key))
							encode(object[key]);
					return
				}
			}
			if (length < 0x18) { // write the array header
				target[position++] = 0x80 | length;
			} else {
				writeArrayHeader(length);
			}
			if (skipValues) return; // special exit for iterator
			for (let key in object)
				if (typeof object.hasOwnProperty !== 'function' || object.hasOwnProperty(key))
					encode(object[key]);
		};
		const makeRoom = (end) => {
			let newSize;
			if (end > 0x1000000) {
				// special handling for really large buffers
				if ((end - start) > MAX_BUFFER_SIZE)
					throw new Error('Encoded buffer would be larger than maximum buffer size')
				newSize = Math.min(MAX_BUFFER_SIZE,
					Math.round(Math.max((end - start) * (end > 0x4000000 ? 1.25 : 2), 0x400000) / 0x1000) * 0x1000);
			} else // faster handling for smaller buffers
				newSize = ((Math.max((end - start) << 2, target.length - 1) >> 12) + 1) << 12;
			let newBuffer = new ByteArrayAllocate(newSize);
			targetView = new DataView(newBuffer.buffer, 0, newSize);
			if (target.copy)
				target.copy(newBuffer, 0, start, end);
			else
				newBuffer.set(target.slice(start, end));
			position -= start;
			start = 0;
			safeEnd = newBuffer.length - 10;
			return target = newBuffer
		};
		let chunkThreshold = 100;
		let continuedChunkThreshold = 1000;
		this.encodeAsIterable = function(value, options) {
			return startEncoding(value, options, encodeObjectAsIterable);
		};
		this.encodeAsAsyncIterable = function(value, options) {
			return startEncoding(value, options, encodeObjectAsAsyncIterable);
		};

		function* encodeObjectAsIterable(object, iterateProperties, finalIterable) {
			let constructor = object.constructor;
			if (constructor === Object) {
				let useRecords = encoder.useRecords !== false;
				if (useRecords)
					writeObject(object, true); // write the record identifier
				else
					writeEntityLength(Object.keys(object).length, 0xa0);
				for (let key in object) {
					let value = object[key];
					if (!useRecords) encode(key);
					if (value && typeof value === 'object') {
						if (iterateProperties[key])
							yield* encodeObjectAsIterable(value, iterateProperties[key]);
						else
							yield* tryEncode(value, iterateProperties, key);
					} else encode(value);
				}
			} else if (constructor === Array) {
				let length = object.length;
				writeArrayHeader(length);
				for (let i = 0; i < length; i++) {
					let value = object[i];
					if (value && (typeof value === 'object' || position - start > chunkThreshold)) {
						if (iterateProperties.element)
							yield* encodeObjectAsIterable(value, iterateProperties.element);
						else
							yield* tryEncode(value, iterateProperties, 'element');
					} else encode(value);
				}
			} else if (object[Symbol.iterator] && !object.buffer) { // iterator, but exclude typed arrays
				target[position++] = 0x9f; // start indefinite array
				for (let value of object) {
					if (value && (typeof value === 'object' || position - start > chunkThreshold)) {
						if (iterateProperties.element)
							yield* encodeObjectAsIterable(value, iterateProperties.element);
						else
							yield* tryEncode(value, iterateProperties, 'element');
					} else encode(value);
				}
				target[position++] = 0xff; // stop byte
			} else if (isBlob(object)){
				writeEntityLength(object.size, 0x40); // encode as binary data
				yield target.subarray(start, position);
				yield object; // directly return blobs, they have to be encoded asynchronously
				restartEncoding();
			} else if (object[Symbol.asyncIterator]) {
				target[position++] = 0x9f; // start indefinite array
				yield target.subarray(start, position);
				yield object; // directly return async iterators, they have to be encoded asynchronously
				restartEncoding();
				target[position++] = 0xff; // stop byte
			} else {
				encode(object);
			}
			if (finalIterable && position > start) yield target.subarray(start, position);
			else if (position - start > chunkThreshold) {
				yield target.subarray(start, position);
				restartEncoding();
			}
		}
		function* tryEncode(value, iterateProperties, key) {
			let restart = position - start;
			try {
				encode(value);
				if (position - start > chunkThreshold) {
					yield target.subarray(start, position);
					restartEncoding();
				}
			} catch (error) {
				if (error.iteratorNotHandled) {
					iterateProperties[key] = {};
					position = start + restart; // restart our position so we don't have partial data from last encode
					yield* encodeObjectAsIterable.call(this, value, iterateProperties[key]);
				} else throw error;
			}
		}
		function restartEncoding() {
			chunkThreshold = continuedChunkThreshold;
			encoder.encode(null, THROW_ON_ITERABLE); // restart encoding
		}
		function startEncoding(value, options, encodeIterable) {
			if (options && options.chunkThreshold) // explicitly specified chunk sizes
				chunkThreshold = continuedChunkThreshold = options.chunkThreshold;
			else // we start with a smaller threshold to get initial bytes sent quickly
				chunkThreshold = 100;
			if (value && typeof value === 'object') {
				encoder.encode(null, THROW_ON_ITERABLE); // start encoding
				return encodeIterable(value, encoder.iterateProperties || (encoder.iterateProperties = {}), true);
			}
			return [encoder.encode(value)];
		}

		async function* encodeObjectAsAsyncIterable(value, iterateProperties) {
			for (let encodedValue of encodeObjectAsIterable(value, iterateProperties, true)) {
				let constructor = encodedValue.constructor;
				if (constructor === ByteArray || constructor === Uint8Array)
					yield encodedValue;
				else if (isBlob(encodedValue)) {
					let reader = encodedValue.stream().getReader();
					let next;
					while (!(next = await reader.read()).done) {
						yield next.value;
					}
				} else if (encodedValue[Symbol.asyncIterator]) {
					for await (let asyncValue of encodedValue) {
						restartEncoding();
						if (asyncValue)
							yield* encodeObjectAsAsyncIterable(asyncValue, iterateProperties.async || (iterateProperties.async = {}));
						else yield encoder.encode(asyncValue);
					}
				} else {
					yield encodedValue;
				}
			}
		}
	}
	useBuffer(buffer) {
		// this means we are finished using our own buffer and we can write over it safely
		target = buffer;
		targetView = new DataView(target.buffer, target.byteOffset, target.byteLength);
		position = 0;
	}
	clearSharedData() {
		if (this.structures)
			this.structures = [];
		if (this.sharedValues)
			this.sharedValues = undefined;
	}
	updateSharedData() {
		let lastVersion = this.sharedVersion || 0;
		this.sharedVersion = lastVersion + 1;
		let structuresCopy = this.structures.slice(0);
		let sharedData = new SharedData(structuresCopy, this.sharedValues, this.sharedVersion);
		let saveResults = this.saveShared(sharedData,
				existingShared => (existingShared && existingShared.version || 0) == lastVersion);
		if (saveResults === false) {
			// get updated structures and try again if the update failed
			sharedData = this.getShared() || {};
			this.structures = sharedData.structures || [];
			this.sharedValues = sharedData.packedValues;
			this.sharedVersion = sharedData.version;
			this.structures.nextId = this.structures.length;
		} else {
			// restore structures
			structuresCopy.forEach((structure, i) => this.structures[i] = structure);
		}
		// saveShared may fail to write and reload, or may have reloaded to check compatibility and overwrite saved data, either way load the correct shared data
		return saveResults
	}
}
function writeEntityLength(length, majorValue) {
	if (length < 0x18)
		target[position++] = majorValue | length;
	else if (length < 0x100) {
		target[position++] = majorValue | 0x18;
		target[position++] = length;
	} else if (length < 0x10000) {
		target[position++] = majorValue | 0x19;
		target[position++] = length >> 8;
		target[position++] = length & 0xff;
	} else {
		target[position++] = majorValue | 0x1a;
		targetView.setUint32(position, length);
		position += 4;
	}

}
class SharedData {
	constructor(structures, values, version) {
		this.structures = structures;
		this.packedValues = values;
		this.version = version;
	}
}

function writeArrayHeader(length) {
	if (length < 0x18)
		target[position++] = 0x80 | length;
	else if (length < 0x100) {
		target[position++] = 0x98;
		target[position++] = length;
	} else if (length < 0x10000) {
		target[position++] = 0x99;
		target[position++] = length >> 8;
		target[position++] = length & 0xff;
	} else {
		target[position++] = 0x9a;
		targetView.setUint32(position, length);
		position += 4;
	}
}

const BlobConstructor = typeof Blob === 'undefined' ? function(){} : Blob;
function isBlob(object) {
	if (object instanceof BlobConstructor)
		return true;
	let tag = object[Symbol.toStringTag];
	return tag === 'Blob' || tag === 'File';
}
function findRepetitiveStrings(value, packedValues) {
	switch(typeof value) {
		case 'string':
			if (value.length > 3) {
				if (packedValues.objectMap[value] > -1 || packedValues.values.length >= packedValues.maxValues)
					return
				let packedStatus = packedValues.get(value);
				if (packedStatus) {
					if (++packedStatus.count == 2) {
						packedValues.values.push(value);
					}
				} else {
					packedValues.set(value, {
						count: 1,
					});
					if (packedValues.samplingPackedValues) {
						let status = packedValues.samplingPackedValues.get(value);
						if (status)
							status.count++;
						else
							packedValues.samplingPackedValues.set(value, {
								count: 1,
							});
					}
				}
			}
			break
		case 'object':
			if (value) {
				if (value instanceof Array) {
					for (let i = 0, l = value.length; i < l; i++) {
						findRepetitiveStrings(value[i], packedValues);
					}

				} else {
					let includeKeys = !packedValues.encoder.useRecords;
					for (var key in value) {
						if (value.hasOwnProperty(key)) {
							if (includeKeys)
								findRepetitiveStrings(key, packedValues);
							findRepetitiveStrings(value[key], packedValues);
						}
					}
				}
			}
			break
		case 'function': console.log(value);
	}
}
const isLittleEndianMachine = new Uint8Array(new Uint16Array([1]).buffer)[0] == 1;
extensionClasses = [ Date, Set, Error, RegExp, Tag, ArrayBuffer,
	Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array,
	typeof BigUint64Array == 'undefined' ? function() {} : BigUint64Array, Int8Array, Int16Array, Int32Array,
	typeof BigInt64Array == 'undefined' ? function() {} : BigInt64Array,
	Float32Array, Float64Array, SharedData ];

//Object.getPrototypeOf(Uint8Array.prototype).constructor /*TypedArray*/
extensions = [{ // Date
	tag: 1,
	encode(date, encode) {
		let seconds = date.getTime() / 1000;
		if ((this.useTimestamp32 || date.getMilliseconds() === 0) && seconds >= 0 && seconds < 0x100000000) {
			// Timestamp 32
			target[position++] = 0x1a;
			targetView.setUint32(position, seconds);
			position += 4;
		} else {
			// Timestamp float64
			target[position++] = 0xfb;
			targetView.setFloat64(position, seconds);
			position += 8;
		}
	}
}, { // Set
	tag: 258, // https://github.com/input-output-hk/cbor-sets-spec/blob/master/CBOR_SETS.md
	encode(set, encode) {
		let array = Array.from(set);
		encode(array);
	}
}, { // Error
	tag: 27, // http://cbor.schmorp.de/generic-object
	encode(error, encode) {
		encode([ error.name, error.message ]);
	}
}, { // RegExp
	tag: 27, // http://cbor.schmorp.de/generic-object
	encode(regex, encode) {
		encode([ 'RegExp', regex.source, regex.flags ]);
	}
}, { // Tag
	getTag(tag) {
		return tag.tag
	},
	encode(tag, encode) {
		encode(tag.value);
	}
}, { // ArrayBuffer
	encode(arrayBuffer, encode, makeRoom) {
		writeBuffer(arrayBuffer, makeRoom);
	}
}, { // Uint8Array
	getTag(typedArray) {
		if (typedArray.constructor === Uint8Array) {
			if (this.tagUint8Array || hasNodeBuffer && this.tagUint8Array !== false)
				return 64;
		} // else no tag
	},
	encode(typedArray, encode, makeRoom) {
		writeBuffer(typedArray, makeRoom);
	}
},
	typedArrayEncoder(68, 1),
	typedArrayEncoder(69, 2),
	typedArrayEncoder(70, 4),
	typedArrayEncoder(71, 8),
	typedArrayEncoder(72, 1),
	typedArrayEncoder(77, 2),
	typedArrayEncoder(78, 4),
	typedArrayEncoder(79, 8),
	typedArrayEncoder(85, 4),
	typedArrayEncoder(86, 8),
{
	encode(sharedData, encode) { // write SharedData
		let packedValues = sharedData.packedValues || [];
		let sharedStructures = sharedData.structures || [];
		if (packedValues.values.length > 0) {
			target[position++] = 0xd8; // one-byte tag
			target[position++] = 51; // tag 51 for packed shared structures https://www.potaroo.net/ietf/ids/draft-ietf-cbor-packed-03.txt
			writeArrayHeader(4);
			let valuesArray = packedValues.values;
			encode(valuesArray);
			writeArrayHeader(0); // prefixes
			writeArrayHeader(0); // suffixes
			packedObjectMap = Object.create(sharedPackedObjectMap || null);
			for (let i = 0, l = valuesArray.length; i < l; i++) {
				packedObjectMap[valuesArray[i]] = i;
			}
		}
		if (sharedStructures) {
			targetView.setUint32(position, 0xd9dffe00);
			position += 3;
			let definitions = sharedStructures.slice(0);
			definitions.unshift(0xe000);
			definitions.push(new Tag(sharedData.version, 0x53687264));
			encode(definitions);
		} else
			encode(new Tag(sharedData.version, 0x53687264));
		}
	}];
function typedArrayEncoder(tag, size) {
	if (!isLittleEndianMachine && size > 1)
		tag -= 4; // the big endian equivalents are 4 less
	return {
		tag: tag,
		encode: function writeExtBuffer(typedArray, encode) {
			let length = typedArray.byteLength;
			let offset = typedArray.byteOffset || 0;
			let buffer = typedArray.buffer || typedArray;
			encode(hasNodeBuffer ? Buffer.from(buffer, offset, length) :
				new Uint8Array(buffer, offset, length));
		}
	}
}
function writeBuffer(buffer, makeRoom) {
	let length = buffer.byteLength;
	if (length < 0x18) {
		target[position++] = 0x40 + length;
	} else if (length < 0x100) {
		target[position++] = 0x58;
		target[position++] = length;
	} else if (length < 0x10000) {
		target[position++] = 0x59;
		target[position++] = length >> 8;
		target[position++] = length & 0xff;
	} else {
		target[position++] = 0x5a;
		targetView.setUint32(position, length);
		position += 4;
	}
	if (position + length >= target.length) {
		makeRoom(position + length);
	}
	// if it is already a typed array (has an ArrayBuffer), use that, but if it is an ArrayBuffer itself,
	// must wrap it to set it.
	target.set(buffer.buffer ? buffer : new Uint8Array(buffer), position);
	position += length;
}

function insertIds(serialized, idsToInsert) {
	// insert the ids that need to be referenced for structured clones
	let nextId;
	let distanceToMove = idsToInsert.length * 2;
	let lastEnd = serialized.length - distanceToMove;
	idsToInsert.sort((a, b) => a.offset > b.offset ? 1 : -1);
	for (let id = 0; id < idsToInsert.length; id++) {
		let referee = idsToInsert[id];
		referee.id = id;
		for (let position of referee.references) {
			serialized[position++] = id >> 8;
			serialized[position] = id & 0xff;
		}
	}
	while (nextId = idsToInsert.pop()) {
		let offset = nextId.offset;
		serialized.copyWithin(offset + distanceToMove, offset, lastEnd);
		distanceToMove -= 2;
		let position = offset + distanceToMove;
		serialized[position++] = 0xd8;
		serialized[position++] = 28; // http://cbor.schmorp.de/value-sharing
		lastEnd = offset;
	}
	return serialized
}
function writeBundles(start, encode) {
	targetView.setUint32(bundledStrings.position + start, position - bundledStrings.position - start + 1); // the offset to bundle
	let writeStrings = bundledStrings;
	bundledStrings = null;
	encode(writeStrings[0]);
	encode(writeStrings[1]);
}
let defaultEncoder = new Encoder({ useRecords: false });
defaultEncoder.encode;
defaultEncoder.encodeAsIterable;
defaultEncoder.encodeAsAsyncIterable;
const REUSE_BUFFER_MODE = 512;
const RESET_BUFFER_MODE = 1024;
const THROW_ON_ITERABLE = 2048;

// This is an unfortunate replacement for @sindresorhus/is that we need to
// re-implement for performance purposes. In particular the is.observable()
// check is expensive, and unnecessary for our purposes. The values returned
// are compatible with @sindresorhus/is, however.

// Types that reach getObjectType() - excludes types with fast-paths above:
// primitives (typeof), Array (isArray), Uint8Array (instanceof), plain Object (constructor)
const objectTypeNames = [
  'Object', // for Object.create(null) and other non-plain objects
  'RegExp',
  'Date',
  'Error',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'ArrayBuffer',
  'SharedArrayBuffer',
  'DataView',
  'Promise',
  'URL',
  'HTMLElement',
  'Int8Array',
  'Uint8ClampedArray',
  'Int16Array',
  'Uint16Array',
  'Int32Array',
  'Uint32Array',
  'Float32Array',
  'Float64Array',
  'BigInt64Array',
  'BigUint64Array',
  'Tagged'
];

/**
 * @param {any} value
 * @returns {string}
 */
function is (value) {
  if (value === null) {
    return 'null'
  }
  if (value === undefined) {
    return 'undefined'
  }
  if (value === true || value === false) {
    return 'boolean'
  }
  const typeOf = typeof value;
  if (typeOf === 'string' || typeOf === 'number' || typeOf === 'bigint' || typeOf === 'symbol') {
    return typeOf
  }
  /* c8 ignore next 3 */
  if (typeOf === 'function') {
    return 'Function'
  }
  if (Array.isArray(value)) {
    return 'Array'
  }
  // Also catches Node.js Buffer which extends Uint8Array
  if (value instanceof Uint8Array) {
    return 'Uint8Array'
  }
  // Fast path for plain objects (most common case after primitives/arrays/bytes)
  if (value.constructor === Object) {
    return 'Object'
  }
  const objectType = getObjectType(value);
  if (objectType) {
    return objectType
  }
  /* c8 ignore next */
  return 'Object'
}

/**
 * @param {any} value
 * @returns {string|undefined}
 */
function getObjectType (value) {
  const objectTypeName = Object.prototype.toString.call(value).slice(8, -1);
  if (objectTypeNames.includes(objectTypeName)) {
    return objectTypeName
  }
  /* c8 ignore next */
  return undefined
}

class Type {
  /**
   * @param {number} major
   * @param {string} name
   * @param {boolean} terminal
   */
  constructor (major, name, terminal) {
    this.major = major;
    this.majorEncoded = major << 5;
    this.name = name;
    this.terminal = terminal;
  }

  /* c8 ignore next 3 */
  toString () {
    return `Type[${this.major}].${this.name}`
  }

  /**
   * @param {Type} typ
   * @returns {number}
   */
  compare (typ) {
    /* c8 ignore next 1 */
    return this.major < typ.major ? -1 : this.major > typ.major ? 1 : 0
  }

  /**
   * Check equality between two Type instances. Safe to use across different
   * copies of the Type class (e.g., when bundlers duplicate the module).
   * (major, name) uniquely identifies a Type; terminal is implied by these.
   * @param {Type} a
   * @param {Type} b
   * @returns {boolean}
   */
  static equals (a, b) {
    return a === b || (a.major === b.major && a.name === b.name)
  }
}

// convert to static fields when better supported
Type.uint = new Type(0, 'uint', true);
Type.negint = new Type(1, 'negint', true);
Type.bytes = new Type(2, 'bytes', true);
Type.string = new Type(3, 'string', true);
Type.array = new Type(4, 'array', false);
Type.map = new Type(5, 'map', false);
Type.tag = new Type(6, 'tag', false); // terminal?
Type.float = new Type(7, 'float', true);
Type.false = new Type(7, 'false', true);
Type.true = new Type(7, 'true', true);
Type.null = new Type(7, 'null', true);
Type.undefined = new Type(7, 'undefined', true);
Type.break = new Type(7, 'break', true);
// Type.indefiniteLength = new Type(0, 'indefiniteLength', true)

class Token {
  /**
   * @param {Type} type
   * @param {any} [value]
   * @param {number} [encodedLength]
   */
  constructor (type, value, encodedLength) {
    this.type = type;
    this.value = value;
    this.encodedLength = encodedLength;
    /** @type {Uint8Array|undefined} */
    this.encodedBytes = undefined;
    /** @type {Uint8Array|undefined} */
    this.byteValue = undefined;
  }

  /* c8 ignore next 3 */
  toString () {
    return `Token[${this.type}].${this.value}`
  }
}

// Use Uint8Array directly in the browser, use Buffer in Node.js but don't
// speak its name directly to avoid bundlers pulling in the `Buffer` polyfill

// @ts-ignore
const useBuffer = globalThis.process &&
  // @ts-ignore
  !globalThis.process.browser &&
  // @ts-ignore
  globalThis.Buffer &&
  // @ts-ignore
  typeof globalThis.Buffer.isBuffer === 'function';

const textEncoder$2 = new TextEncoder();

/**
 * @param {Uint8Array} buf
 * @returns {boolean}
 */
function isBuffer (buf) {
  // @ts-ignore
  return useBuffer && globalThis.Buffer.isBuffer(buf)
}

/**
 * @param {Uint8Array|number[]} buf
 * @returns {Uint8Array}
 */
function asU8A (buf) {
  /* c8 ignore next */
  if (!(buf instanceof Uint8Array)) {
    return Uint8Array.from(buf)
  }
  return isBuffer(buf) ? new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength) : buf
}

// Threshold for manual UTF-8 encoding vs native methods.
// Node.js Buffer.from: crossover ~24 chars
// Browser TextEncoder: crossover ~200 chars
const FROM_STRING_THRESHOLD_BUFFER = 24;
const FROM_STRING_THRESHOLD_TEXTENCODER = 200;

const fromString = useBuffer
  ? // eslint-disable-line operator-linebreak
    /**
     * @param {string} string
     */
    (string) => {
      return string.length >= FROM_STRING_THRESHOLD_BUFFER
        ? // eslint-disable-line operator-linebreak
      // @ts-ignore
        globalThis.Buffer.from(string)
        : utf8ToBytes(string)
    }
  /* c8 ignore next 7 */
  : // eslint-disable-line operator-linebreak
    /**
     * @param {string} string
     */
    (string) => {
      return string.length >= FROM_STRING_THRESHOLD_TEXTENCODER ? textEncoder$2.encode(string) : utf8ToBytes(string)
    };

/**
 * Buffer variant not fast enough for what we need
 * @param {number[]} arr
 * @returns {Uint8Array}
 */
const fromArray = (arr) => {
  return Uint8Array.from(arr)
};

const slice = useBuffer
  ? // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array} bytes
     * @param {number} start
     * @param {number} end
     */
    // Buffer.slice() returns a view, not a copy, so we need special handling
    (bytes, start, end) => {
      if (isBuffer(bytes)) {
        return new Uint8Array(bytes.subarray(start, end))
      }
      return bytes.slice(start, end)
    }
  /* c8 ignore next 9 */
  : // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array} bytes
     * @param {number} start
     * @param {number} end
     */
    (bytes, start, end) => {
      return bytes.slice(start, end)
    };

const concat = useBuffer
  ? // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array[]} chunks
     * @param {number} length
     * @returns {Uint8Array}
     */
    (chunks, length) => {
      // might get a stray plain Array here
      /* c8 ignore next 1 */
      chunks = chunks.map((c) => c instanceof Uint8Array
        ? c
        // this case is occasionally missed during test runs so becomes coverage-flaky
        /* c8 ignore next 4 */
        : // eslint-disable-line operator-linebreak
        // @ts-ignore
        globalThis.Buffer.from(c));
      // @ts-ignore
      return asU8A(globalThis.Buffer.concat(chunks, length))
    }
  /* c8 ignore next 19 */
  : // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array[]} chunks
     * @param {number} length
     * @returns {Uint8Array}
     */
    (chunks, length) => {
      const out = new Uint8Array(length);
      let off = 0;
      for (let b of chunks) {
        if (off + b.length > out.length) {
          // final chunk that's bigger than we need
          b = b.subarray(0, out.length - off);
        }
        out.set(b, off);
        off += b.length;
      }
      return out
    };

const alloc = useBuffer
  ? // eslint-disable-line operator-linebreak
    /**
     * @param {number} size
     * @returns {Uint8Array}
     */
    (size) => {
      // we always write over the contents we expose so this should be safe
      // @ts-ignore
      return globalThis.Buffer.allocUnsafe(size)
    }
  /* c8 ignore next 8 */
  : // eslint-disable-line operator-linebreak
    /**
     * @param {number} size
     * @returns {Uint8Array}
     */
    (size) => {
      return new Uint8Array(size)
    };

/**
 * @param {Uint8Array} b1
 * @param {Uint8Array} b2
 * @returns {number}
 */
function compare (b1, b2) {
  /* c8 ignore next 5 */
  if (isBuffer(b1) && isBuffer(b2)) {
    // probably not possible to get here in the current API
    // @ts-ignore Buffer
    return b1.compare(b2)
  }
  for (let i = 0; i < b1.length; i++) {
    if (b1[i] === b2[i]) {
      continue
    }
    return b1[i] < b2[i] ? -1 : 1
  } /* c8 ignore next 3 */
  return 0
}

// The below code is taken from https://github.com/google/closure-library/blob/8598d87242af59aac233270742c8984e2b2bdbe0/closure/goog/crypt/crypt.js#L117-L143
// Licensed Apache-2.0.

/**
 * @param {string} str
 * @returns {number[]}
 */
function utf8ToBytes (str) {
  const out = [];
  let p = 0;
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 128) {
      out[p++] = c;
    } else if (c < 2048) {
      out[p++] = (c >> 6) | 192;
      out[p++] = (c & 63) | 128;
    } else if (
      ((c & 0xFC00) === 0xD800) && (i + 1) < str.length &&
      ((str.charCodeAt(i + 1) & 0xFC00) === 0xDC00)) {
      // Surrogate Pair
      c = 0x10000 + ((c & 0x03FF) << 10) + (str.charCodeAt(++i) & 0x03FF);
      out[p++] = (c >> 18) | 240;
      out[p++] = ((c >> 12) & 63) | 128;
      out[p++] = ((c >> 6) & 63) | 128;
      out[p++] = (c & 63) | 128;
    } else {
      if ((c >= 0xD800) && (c <= 0xDFFF)) {
        c = 0xFFFD; // Unpaired Surrogate
      }
      out[p++] = (c >> 12) | 224;
      out[p++] = ((c >> 6) & 63) | 128;
      out[p++] = (c & 63) | 128;
    }
  }
  return out
}

/**
 * Bl is a list of byte chunks, similar to https://github.com/rvagg/bl but for
 * writing rather than reading.
 * A Bl object accepts set() operations for individual bytes and copyTo() for
 * inserting byte arrays. These write operations don't automatically increment
 * the internal cursor so its "length" won't be changed. Instead, increment()
 * must be called to extend its length to cover the inserted data.
 * The toBytes() call will convert all internal memory to a single Uint8Array of
 * the correct length, truncating any data that is stored but hasn't been
 * included by an increment().
 * get() can retrieve a single byte.
 * All operations (except toBytes()) take an "offset" argument that will perform
 * the write at the offset _from the current cursor_. For most operations this
 * will be `0` to write at the current cursor position but it can be ahead of
 * the current cursor. Negative offsets probably work but are untested.
 */


// the ts-ignores in this file are almost all for the `Uint8Array|number[]` duality that exists
// for perf reasons. Consider better approaches to this or removing it entirely, it is quite
// risky because of some assumptions about small chunks === number[] and everything else === Uint8Array.

const defaultChunkSize = 256;

class Bl {
  /**
   * @param {number} [chunkSize]
   */
  constructor (chunkSize = defaultChunkSize) {
    this.chunkSize = chunkSize;
    /** @type {number} */
    this.cursor = 0;
    /** @type {number} */
    this.maxCursor = -1;
    /** @type {(Uint8Array|number[])[]} */
    this.chunks = [];
    // keep the first chunk around if we can to save allocations for future encodes
    /** @type {Uint8Array|number[]|null} */
    this._initReuseChunk = null;
  }

  reset () {
    this.cursor = 0;
    this.maxCursor = -1;
    if (this.chunks.length) {
      this.chunks = [];
    }
    if (this._initReuseChunk !== null) {
      this.chunks.push(this._initReuseChunk);
      this.maxCursor = this._initReuseChunk.length - 1;
    }
  }

  /**
   * @param {Uint8Array|number[]} bytes
   */
  push (bytes) {
    let topChunk = this.chunks[this.chunks.length - 1];
    const newMax = this.cursor + bytes.length;
    if (newMax <= this.maxCursor + 1) {
      // we have at least one chunk and we can fit these bytes into that chunk
      const chunkPos = topChunk.length - (this.maxCursor - this.cursor) - 1;
      // @ts-ignore
      topChunk.set(bytes, chunkPos);
    } else {
      // can't fit it in
      if (topChunk) {
        // trip the last chunk to `cursor` if we need to
        const chunkPos = topChunk.length - (this.maxCursor - this.cursor) - 1;
        if (chunkPos < topChunk.length) {
          // @ts-ignore
          this.chunks[this.chunks.length - 1] = topChunk.subarray(0, chunkPos);
          this.maxCursor = this.cursor - 1;
        }
      }
      if (bytes.length < 64 && bytes.length < this.chunkSize) {
        // make a new chunk and copy the new one into it
        topChunk = alloc(this.chunkSize);
        this.chunks.push(topChunk);
        this.maxCursor += topChunk.length;
        if (this._initReuseChunk === null) {
          this._initReuseChunk = topChunk;
        }
        // @ts-ignore
        topChunk.set(bytes, 0);
      } else {
        // push the new bytes in as its own chunk
        this.chunks.push(bytes);
        this.maxCursor += bytes.length;
      }
    }
    this.cursor += bytes.length;
  }

  /**
   * @param {boolean} [reset]
   * @returns {Uint8Array}
   */
  toBytes (reset = false) {
    let byts;
    if (this.chunks.length === 1) {
      const chunk = this.chunks[0];
      if (reset && this.cursor > chunk.length / 2) {
        /* c8 ignore next 2 */
        // @ts-ignore
        byts = this.cursor === chunk.length ? chunk : chunk.subarray(0, this.cursor);
        this._initReuseChunk = null;
        this.chunks = [];
      } else {
        // @ts-ignore
        byts = slice(chunk, 0, this.cursor);
      }
    } else {
      // @ts-ignore
      byts = concat(this.chunks, this.cursor);
    }
    if (reset) {
      this.reset();
    }
    return byts
  }
}

/**
 * U8Bl is a buffer list that writes directly to a user-provided Uint8Array.
 * It provides the same interface as Bl but writes to a fixed destination.
 */
class U8Bl {
  /**
   * @param {Uint8Array} dest
   */
  constructor (dest) {
    this.dest = dest;
    /** @type {number} */
    this.cursor = 0;
    // chunks is for interface compatibility with Bl - encode.js checks chunks.length
    // as a sanity check for pre-calculated sizes. For U8Bl this is always [dest].
    /** @type {Uint8Array[]} */
    this.chunks = [dest];
  }

  reset () {
    this.cursor = 0;
  }

  /**
   * @param {Uint8Array|number[]} bytes
   */
  push (bytes) {
    if (this.cursor + bytes.length > this.dest.length) {
      throw new Error('write out of bounds, destination buffer is too small')
    }
    this.dest.set(bytes, this.cursor);
    this.cursor += bytes.length;
  }

  /**
   * @param {boolean} [reset]
   * @returns {Uint8Array}
   */
  toBytes (reset = false) {
    const byts = this.dest.subarray(0, this.cursor);
    if (reset) {
      this.reset();
    }
    return byts
  }
}

const decodeErrPrefix = 'CBOR decode error:';
const encodeErrPrefix = 'CBOR encode error:';

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} need
 */
function assertEnoughData (data, pos, need) {
  if (data.length - pos < need) {
    throw new Error(`${decodeErrPrefix} not enough data for type`)
  }
}

/* globals BigInt */


const uintBoundaries = [24, 256, 65536, 4294967296, BigInt('18446744073709551616')];

/**
 * @typedef {import('../interface.js').ByteWriter} ByteWriter
 * @typedef {import('../interface.js').DecodeOptions} DecodeOptions
 */

/**
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {DecodeOptions} options
 * @returns {number}
 */
function readUint8 (data, offset, options) {
  assertEnoughData(data, offset, 1);
  const value = data[offset];
  if (options.strict === true && value < uintBoundaries[0]) {
    throw new Error(`${decodeErrPrefix} integer encoded in more bytes than necessary (strict decode)`)
  }
  return value
}

/**
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {DecodeOptions} options
 * @returns {number}
 */
function readUint16 (data, offset, options) {
  assertEnoughData(data, offset, 2);
  const value = (data[offset] << 8) | data[offset + 1];
  if (options.strict === true && value < uintBoundaries[1]) {
    throw new Error(`${decodeErrPrefix} integer encoded in more bytes than necessary (strict decode)`)
  }
  return value
}

/**
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {DecodeOptions} options
 * @returns {number}
 */
function readUint32 (data, offset, options) {
  assertEnoughData(data, offset, 4);
  const value = (data[offset] * 16777216 /* 2 ** 24 */) + (data[offset + 1] << 16) + (data[offset + 2] << 8) + data[offset + 3];
  if (options.strict === true && value < uintBoundaries[2]) {
    throw new Error(`${decodeErrPrefix} integer encoded in more bytes than necessary (strict decode)`)
  }
  return value
}

/**
 * @param {Uint8Array} data
 * @param {number} offset
 * @param {DecodeOptions} options
 * @returns {number|bigint}
 */
function readUint64 (data, offset, options) {
  // assume BigInt, convert back to Number if within safe range
  assertEnoughData(data, offset, 8);
  const hi = (data[offset] * 16777216 /* 2 ** 24 */) + (data[offset + 1] << 16) + (data[offset + 2] << 8) + data[offset + 3];
  const lo = (data[offset + 4] * 16777216 /* 2 ** 24 */) + (data[offset + 5] << 16) + (data[offset + 6] << 8) + data[offset + 7];
  const value = (BigInt(hi) << BigInt(32)) + BigInt(lo);
  if (options.strict === true && value < uintBoundaries[3]) {
    throw new Error(`${decodeErrPrefix} integer encoded in more bytes than necessary (strict decode)`)
  }
  if (value <= Number.MAX_SAFE_INTEGER) {
    return Number(value)
  }
  if (options.allowBigInt === true) {
    return value
  }
  throw new Error(`${decodeErrPrefix} integers outside of the safe integer range are not supported`)
}

/* not required thanks to quick[] list
const oneByteTokens = new Array(24).fill(0).map((v, i) => new Token(Type.uint, i, 1))
export function decodeUintCompact (data, pos, minor, options) {
  return oneByteTokens[minor]
}
*/

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeUint8 (data, pos, _minor, options) {
  return new Token(Type.uint, readUint8(data, pos + 1, options), 2)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeUint16 (data, pos, _minor, options) {
  return new Token(Type.uint, readUint16(data, pos + 1, options), 3)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeUint32 (data, pos, _minor, options) {
  return new Token(Type.uint, readUint32(data, pos + 1, options), 5)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeUint64 (data, pos, _minor, options) {
  return new Token(Type.uint, readUint64(data, pos + 1, options), 9)
}

/**
 * @param {ByteWriter} writer
 * @param {Token} token
 */
function encodeUint (writer, token) {
  return encodeUintValue(writer, 0, token.value)
}

/**
 * @param {ByteWriter} writer
 * @param {number} major
 * @param {number|bigint} uint
 */
function encodeUintValue (writer, major, uint) {
  if (uint < uintBoundaries[0]) {
    const nuint = Number(uint);
    // pack into one byte, minor=0, additional=value
    writer.push([major | nuint]);
  } else if (uint < uintBoundaries[1]) {
    const nuint = Number(uint);
    // pack into two byte, minor=0, additional=24
    writer.push([major | 24, nuint]);
  } else if (uint < uintBoundaries[2]) {
    const nuint = Number(uint);
    // pack into three byte, minor=0, additional=25
    writer.push([major | 25, nuint >>> 8, nuint & 0xff]);
  } else if (uint < uintBoundaries[3]) {
    const nuint = Number(uint);
    // pack into five byte, minor=0, additional=26
    writer.push([major | 26, (nuint >>> 24) & 0xff, (nuint >>> 16) & 0xff, (nuint >>> 8) & 0xff, nuint & 0xff]);
  } else {
    const buint = BigInt(uint);
    if (buint < uintBoundaries[4]) {
      // pack into nine byte, minor=0, additional=27
      const set = [major | 27, 0, 0, 0, 0, 0, 0, 0];
      // simulate bitwise above 32 bits
      let lo = Number(buint & BigInt(0xffffffff));
      let hi = Number(buint >> BigInt(32) & BigInt(0xffffffff));
      set[8] = lo & 0xff;
      lo = lo >> 8;
      set[7] = lo & 0xff;
      lo = lo >> 8;
      set[6] = lo & 0xff;
      lo = lo >> 8;
      set[5] = lo & 0xff;
      set[4] = hi & 0xff;
      hi = hi >> 8;
      set[3] = hi & 0xff;
      hi = hi >> 8;
      set[2] = hi & 0xff;
      hi = hi >> 8;
      set[1] = hi & 0xff;
      writer.push(set);
    } else {
      throw new Error(`${decodeErrPrefix} encountered BigInt larger than allowable range`)
    }
  }
}

/**
 * @param {Token} token
 * @returns {number}
 */
encodeUint.encodedSize = function encodedSize (token) {
  return encodeUintValue.encodedSize(token.value)
};

/**
 * @param {number} uint
 * @returns {number}
 */
encodeUintValue.encodedSize = function encodedSize (uint) {
  if (uint < uintBoundaries[0]) {
    return 1
  }
  if (uint < uintBoundaries[1]) {
    return 2
  }
  if (uint < uintBoundaries[2]) {
    return 3
  }
  if (uint < uintBoundaries[3]) {
    return 5
  }
  return 9
};

/**
 * @param {Token} tok1
 * @param {Token} tok2
 * @returns {number}
 */
encodeUint.compareTokens = function compareTokens (tok1, tok2) {
  return tok1.value < tok2.value ? -1 : tok1.value > tok2.value ? 1 : /* c8 ignore next */ 0
};

/* eslint-env es2020 */


/**
 * @typedef {import('../interface.js').ByteWriter} ByteWriter
 * @typedef {import('../interface.js').DecodeOptions} DecodeOptions
 */

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeNegint8 (data, pos, _minor, options) {
  return new Token(Type.negint, -1 - readUint8(data, pos + 1, options), 2)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeNegint16 (data, pos, _minor, options) {
  return new Token(Type.negint, -1 - readUint16(data, pos + 1, options), 3)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeNegint32 (data, pos, _minor, options) {
  return new Token(Type.negint, -1 - readUint32(data, pos + 1, options), 5)
}

const neg1b$1 = BigInt(-1);
const pos1b$1 = BigInt(1);

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeNegint64 (data, pos, _minor, options) {
  const int = readUint64(data, pos + 1, options);
  if (typeof int !== 'bigint') {
    const value = -1 - int;
    if (value >= Number.MIN_SAFE_INTEGER) {
      return new Token(Type.negint, value, 9)
    }
  }
  if (options.allowBigInt !== true) {
    throw new Error(`${decodeErrPrefix} integers outside of the safe integer range are not supported`)
  }
  return new Token(Type.negint, neg1b$1 - BigInt(int), 9)
}

/**
 * @param {ByteWriter} writer
 * @param {Token} token
 */
function encodeNegint (writer, token) {
  const negint = token.value;
  const unsigned = (typeof negint === 'bigint' ? (negint * neg1b$1 - pos1b$1) : (negint * -1 - 1));
  encodeUintValue(writer, token.type.majorEncoded, unsigned);
}

/**
 * @param {Token} token
 * @returns {number}
 */
encodeNegint.encodedSize = function encodedSize (token) {
  const negint = token.value;
  const unsigned = (typeof negint === 'bigint' ? (negint * neg1b$1 - pos1b$1) : (negint * -1 - 1));
  /* c8 ignore next 4 */
  // handled by quickEncode, we shouldn't get here but it's included for completeness
  if (unsigned < uintBoundaries[0]) {
    return 1
  }
  if (unsigned < uintBoundaries[1]) {
    return 2
  }
  if (unsigned < uintBoundaries[2]) {
    return 3
  }
  if (unsigned < uintBoundaries[3]) {
    return 5
  }
  return 9
};

/**
 * @param {Token} tok1
 * @param {Token} tok2
 * @returns {number}
 */
encodeNegint.compareTokens = function compareTokens (tok1, tok2) {
  // opposite of the uint comparison since we store the uint version in bytes
  return tok1.value < tok2.value ? 1 : tok1.value > tok2.value ? -1 : /* c8 ignore next */ 0
};

/**
 * @typedef {import('../interface.js').ByteWriter} ByteWriter
 * @typedef {import('../interface.js').DecodeOptions} DecodeOptions
 */

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} prefix
 * @param {number} length
 * @returns {Token}
 */
function toToken$3 (data, pos, prefix, length) {
  assertEnoughData(data, pos, prefix + length);
  const buf = data.slice(pos + prefix, pos + prefix + length);
  return new Token(Type.bytes, buf, prefix + length)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} minor
 * @param {DecodeOptions} _options
 * @returns {Token}
 */
function decodeBytesCompact (data, pos, minor, _options) {
  return toToken$3(data, pos, 1, minor)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeBytes8 (data, pos, _minor, options) {
  return toToken$3(data, pos, 2, readUint8(data, pos + 1, options))
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeBytes16 (data, pos, _minor, options) {
  return toToken$3(data, pos, 3, readUint16(data, pos + 1, options))
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeBytes32 (data, pos, _minor, options) {
  return toToken$3(data, pos, 5, readUint32(data, pos + 1, options))
}

// TODO: maybe we shouldn't support this ..
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeBytes64 (data, pos, _minor, options) {
  const l = readUint64(data, pos + 1, options);
  if (typeof l === 'bigint') {
    throw new Error(`${decodeErrPrefix} 64-bit integer bytes lengths not supported`)
  }
  return toToken$3(data, pos, 9, l)
}

/**
 * `encodedBytes` allows for caching when we do a byte version of a string
 * for key sorting purposes
 * @param {Token} token
 * @returns {Uint8Array}
 */
function tokenBytes (token) {
  if (token.encodedBytes === undefined) {
    token.encodedBytes = Type.equals(token.type, Type.string) ? fromString(token.value) : token.value;
  }
  // @ts-ignore c'mon
  return token.encodedBytes
}

/**
 * @param {ByteWriter} writer
 * @param {Token} token
 */
function encodeBytes (writer, token) {
  const bytes = tokenBytes(token);
  encodeUintValue(writer, token.type.majorEncoded, bytes.length);
  writer.push(bytes);
}

/**
 * @param {Token} token
 * @returns {number}
 */
encodeBytes.encodedSize = function encodedSize (token) {
  const bytes = tokenBytes(token);
  return encodeUintValue.encodedSize(bytes.length) + bytes.length
};

/**
 * @param {Token} tok1
 * @param {Token} tok2
 * @returns {number}
 */
encodeBytes.compareTokens = function compareTokens (tok1, tok2) {
  return compareBytes(tokenBytes(tok1), tokenBytes(tok2))
};

/**
 * @param {Uint8Array} b1
 * @param {Uint8Array} b2
 * @returns {number}
 */
function compareBytes (b1, b2) {
  return b1.length < b2.length ? -1 : b1.length > b2.length ? 1 : compare(b1, b2)
}

const textDecoder$1 = new TextDecoder();

// Threshold for ASCII fast-path vs TextDecoder. Short ASCII strings (common for
// map keys) are faster to decode with a simple loop than TextDecoder overhead.
const ASCII_THRESHOLD = 32;

/**
 * @typedef {import('../interface.js').ByteWriter} ByteWriter
 * @typedef {import('../interface.js').DecodeOptions} DecodeOptions
 */

/**
 * Decode UTF-8 bytes to string. For short ASCII strings (common case for map keys),
 * a simple loop is faster than TextDecoder.
 * @param {Uint8Array} bytes
 * @param {number} start
 * @param {number} end
 * @returns {string}
 */
function toStr (bytes, start, end) {
  const len = end - start;
  if (len < ASCII_THRESHOLD) {
    let str = '';
    for (let i = start; i < end; i++) {
      const c = bytes[i];
      if (c & 0x80) { // non-ASCII, fall back to TextDecoder
        return textDecoder$1.decode(bytes.subarray(start, end))
      }
      str += String.fromCharCode(c);
    }
    return str
  }
  return textDecoder$1.decode(bytes.subarray(start, end))
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} prefix
 * @param {number} length
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function toToken$2 (data, pos, prefix, length, options) {
  const totLength = prefix + length;
  assertEnoughData(data, pos, totLength);
  const tok = new Token(Type.string, toStr(data, pos + prefix, pos + totLength), totLength);
  if (options.retainStringBytes === true) {
    tok.byteValue = data.slice(pos + prefix, pos + totLength);
  }
  return tok
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeStringCompact (data, pos, minor, options) {
  return toToken$2(data, pos, 1, minor, options)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeString8 (data, pos, _minor, options) {
  return toToken$2(data, pos, 2, readUint8(data, pos + 1, options), options)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeString16 (data, pos, _minor, options) {
  return toToken$2(data, pos, 3, readUint16(data, pos + 1, options), options)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeString32 (data, pos, _minor, options) {
  return toToken$2(data, pos, 5, readUint32(data, pos + 1, options), options)
}

// TODO: maybe we shouldn't support this ..
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeString64 (data, pos, _minor, options) {
  const l = readUint64(data, pos + 1, options);
  if (typeof l === 'bigint') {
    throw new Error(`${decodeErrPrefix} 64-bit integer string lengths not supported`)
  }
  return toToken$2(data, pos, 9, l, options)
}

const encodeString = encodeBytes;

/**
 * @typedef {import('../interface.js').ByteWriter} ByteWriter
 * @typedef {import('../interface.js').DecodeOptions} DecodeOptions
 */

/**
 * @param {Uint8Array} _data
 * @param {number} _pos
 * @param {number} prefix
 * @param {number} length
 * @returns {Token}
 */
function toToken$1 (_data, _pos, prefix, length) {
  return new Token(Type.array, length, prefix)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} minor
 * @param {DecodeOptions} _options
 * @returns {Token}
 */
function decodeArrayCompact (data, pos, minor, _options) {
  return toToken$1(data, pos, 1, minor)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeArray8 (data, pos, _minor, options) {
  return toToken$1(data, pos, 2, readUint8(data, pos + 1, options))
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeArray16 (data, pos, _minor, options) {
  return toToken$1(data, pos, 3, readUint16(data, pos + 1, options))
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeArray32 (data, pos, _minor, options) {
  return toToken$1(data, pos, 5, readUint32(data, pos + 1, options))
}

// TODO: maybe we shouldn't support this ..
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeArray64 (data, pos, _minor, options) {
  const l = readUint64(data, pos + 1, options);
  if (typeof l === 'bigint') {
    throw new Error(`${decodeErrPrefix} 64-bit integer array lengths not supported`)
  }
  return toToken$1(data, pos, 9, l)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeArrayIndefinite (data, pos, _minor, options) {
  if (options.allowIndefinite === false) {
    throw new Error(`${decodeErrPrefix} indefinite length items not allowed`)
  }
  return toToken$1(data, pos, 1, Infinity)
}

/**
 * @param {ByteWriter} writer
 * @param {Token} token
 */
function encodeArray (writer, token) {
  encodeUintValue(writer, Type.array.majorEncoded, token.value);
}

// using an array as a map key, are you sure about this? we can only sort
// by map length here, it's up to the encoder to decide to look deeper
encodeArray.compareTokens = encodeUint.compareTokens;

/**
 * @param {Token} token
 * @returns {number}
 */
encodeArray.encodedSize = function encodedSize (token) {
  return encodeUintValue.encodedSize(token.value)
};

/**
 * @typedef {import('../interface.js').ByteWriter} ByteWriter
 * @typedef {import('../interface.js').DecodeOptions} DecodeOptions
 */

/**
 * @param {Uint8Array} _data
 * @param {number} _pos
 * @param {number} prefix
 * @param {number} length
 * @returns {Token}
 */
function toToken (_data, _pos, prefix, length) {
  return new Token(Type.map, length, prefix)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} minor
 * @param {DecodeOptions} _options
 * @returns {Token}
 */
function decodeMapCompact (data, pos, minor, _options) {
  return toToken(data, pos, 1, minor)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeMap8 (data, pos, _minor, options) {
  return toToken(data, pos, 2, readUint8(data, pos + 1, options))
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeMap16 (data, pos, _minor, options) {
  return toToken(data, pos, 3, readUint16(data, pos + 1, options))
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeMap32 (data, pos, _minor, options) {
  return toToken(data, pos, 5, readUint32(data, pos + 1, options))
}

// TODO: maybe we shouldn't support this ..
/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeMap64 (data, pos, _minor, options) {
  const l = readUint64(data, pos + 1, options);
  if (typeof l === 'bigint') {
    throw new Error(`${decodeErrPrefix} 64-bit integer map lengths not supported`)
  }
  return toToken(data, pos, 9, l)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeMapIndefinite (data, pos, _minor, options) {
  if (options.allowIndefinite === false) {
    throw new Error(`${decodeErrPrefix} indefinite length items not allowed`)
  }
  return toToken(data, pos, 1, Infinity)
}

/**
 * @param {ByteWriter} writer
 * @param {Token} token
 */
function encodeMap (writer, token) {
  encodeUintValue(writer, Type.map.majorEncoded, token.value);
}

// using a map as a map key, are you sure about this? we can only sort
// by map length here, it's up to the encoder to decide to look deeper
encodeMap.compareTokens = encodeUint.compareTokens;

/**
 * @param {Token} token
 * @returns {number}
 */
encodeMap.encodedSize = function encodedSize (token) {
  return encodeUintValue.encodedSize(token.value)
};

/**
 * @typedef {import('../interface.js').ByteWriter} ByteWriter
 * @typedef {import('../interface.js').DecodeOptions} DecodeOptions
 */

/**
 * @param {Uint8Array} _data
 * @param {number} _pos
 * @param {number} minor
 * @param {DecodeOptions} _options
 * @returns {Token}
 */
function decodeTagCompact (_data, _pos, minor, _options) {
  return new Token(Type.tag, minor, 1)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeTag8 (data, pos, _minor, options) {
  return new Token(Type.tag, readUint8(data, pos + 1, options), 2)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeTag16 (data, pos, _minor, options) {
  return new Token(Type.tag, readUint16(data, pos + 1, options), 3)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeTag32 (data, pos, _minor, options) {
  return new Token(Type.tag, readUint32(data, pos + 1, options), 5)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeTag64 (data, pos, _minor, options) {
  return new Token(Type.tag, readUint64(data, pos + 1, options), 9)
}

/**
 * @param {ByteWriter} writer
 * @param {Token} token
 */
function encodeTag (writer, token) {
  encodeUintValue(writer, Type.tag.majorEncoded, token.value);
}

encodeTag.compareTokens = encodeUint.compareTokens;

/**
 * @param {Token} token
 * @returns {number}
 */
encodeTag.encodedSize = function encodedSize (token) {
  return encodeUintValue.encodedSize(token.value)
};

// TODO: shift some of the bytes logic to bytes-utils so we can use Buffer
// where possible


/**
 * @typedef {import('../interface.js').ByteWriter} ByteWriter
 * @typedef {import('../interface.js').DecodeOptions} DecodeOptions
 * @typedef {import('../interface.js').EncodeOptions} EncodeOptions
 */

const MINOR_FALSE = 20;
const MINOR_TRUE = 21;
const MINOR_NULL = 22;
const MINOR_UNDEFINED = 23;

/**
 * @param {Uint8Array} _data
 * @param {number} _pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeUndefined (_data, _pos, _minor, options) {
  if (options.allowUndefined === false) {
    throw new Error(`${decodeErrPrefix} undefined values are not supported`)
  } else if (options.coerceUndefinedToNull === true) {
    return new Token(Type.null, null, 1)
  }
  return new Token(Type.undefined, undefined, 1)
}

/**
 * @param {Uint8Array} _data
 * @param {number} _pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeBreak (_data, _pos, _minor, options) {
  if (options.allowIndefinite === false) {
    throw new Error(`${decodeErrPrefix} indefinite length items not allowed`)
  }
  return new Token(Type.break, undefined, 1)
}

/**
 * @param {number} value
 * @param {number} bytes
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function createToken (value, bytes, options) {
  if (options) {
    if (options.allowNaN === false && Number.isNaN(value)) {
      throw new Error(`${decodeErrPrefix} NaN values are not supported`)
    }
    if (options.allowInfinity === false && (value === Infinity || value === -Infinity)) {
      throw new Error(`${decodeErrPrefix} Infinity values are not supported`)
    }
  }
  return new Token(Type.float, value, bytes)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeFloat16 (data, pos, _minor, options) {
  return createToken(readFloat16(data, pos + 1), 3, options)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeFloat32 (data, pos, _minor, options) {
  return createToken(readFloat32(data, pos + 1), 5, options)
}

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} _minor
 * @param {DecodeOptions} options
 * @returns {Token}
 */
function decodeFloat64 (data, pos, _minor, options) {
  return createToken(readFloat64(data, pos + 1), 9, options)
}

/**
 * @param {ByteWriter} writer
 * @param {Token} token
 * @param {EncodeOptions} options
 */
function encodeFloat (writer, token, options) {
  const float = token.value;

  if (float === false) {
    writer.push([Type.float.majorEncoded | MINOR_FALSE]);
  } else if (float === true) {
    writer.push([Type.float.majorEncoded | MINOR_TRUE]);
  } else if (float === null) {
    writer.push([Type.float.majorEncoded | MINOR_NULL]);
  } else if (float === undefined) {
    writer.push([Type.float.majorEncoded | MINOR_UNDEFINED]);
  } else {
    let decoded;
    let success = false;
    if (!options || options.float64 !== true) {
      encodeFloat16(float);
      decoded = readFloat16(ui8a, 1);
      if (float === decoded || Number.isNaN(float)) {
        ui8a[0] = 0xf9;
        writer.push(ui8a.slice(0, 3));
        success = true;
      } else {
        encodeFloat32(float);
        decoded = readFloat32(ui8a, 1);
        if (float === decoded) {
          ui8a[0] = 0xfa;
          writer.push(ui8a.slice(0, 5));
          success = true;
        }
      }
    }
    if (!success) {
      encodeFloat64(float);
      decoded = readFloat64(ui8a, 1);
      ui8a[0] = 0xfb;
      writer.push(ui8a.slice(0, 9));
    }
  }
}

/**
 * @param {Token} token
 * @param {EncodeOptions} options
 * @returns {number}
 */
encodeFloat.encodedSize = function encodedSize (token, options) {
  const float = token.value;

  if (float === false || float === true || float === null || float === undefined) {
    return 1
  }

  if (!options || options.float64 !== true) {
    encodeFloat16(float);
    let decoded = readFloat16(ui8a, 1);
    if (float === decoded || Number.isNaN(float)) {
      return 3
    }
    encodeFloat32(float);
    decoded = readFloat32(ui8a, 1);
    if (float === decoded) {
      return 5
    }
  }
  return 9
};

const buffer = new ArrayBuffer(9);
const dataView = new DataView(buffer, 1);
const ui8a = new Uint8Array(buffer, 0);

/**
 * @param {number} inp
 */
function encodeFloat16 (inp) {
  if (inp === Infinity) {
    dataView.setUint16(0, 0x7c00, false);
  } else if (inp === -Infinity) {
    dataView.setUint16(0, 0xfc00, false);
  } else if (Number.isNaN(inp)) {
    dataView.setUint16(0, 0x7e00, false);
  } else {
    dataView.setFloat32(0, inp);
    const valu32 = dataView.getUint32(0);
    const exponent = (valu32 & 0x7f800000) >> 23;
    const mantissa = valu32 & 0x7fffff;

    /* c8 ignore next 6 */
    if (exponent === 0xff) {
      // too big, Infinity, but this should be hard (impossible?) to trigger
      dataView.setUint16(0, 0x7c00, false);
    } else if (exponent === 0x00) {
      // 0.0, -0.0 and subnormals, shouldn't be possible to get here because 0.0 should be counted as an int
      // Use valu32 for sign bit since bitwise ops on floats lose -0 sign
      dataView.setUint16(0, ((valu32 & 0x80000000) >> 16) | (mantissa >> 13), false);
    } else { // standard numbers
      // chunks of logic here borrowed from https://github.com/PJK/libcbor/blob/c78f437182533e3efa8d963ff4b945bb635c2284/src/cbor/encoding.c#L127
      const logicalExponent = exponent - 127;
      // Now we know that 2^exponent <= 0 logically
      /* c8 ignore next 6 */
      if (logicalExponent < -24) {
        /* No unambiguous representation exists, this float is not a half float
          and is too small to be represented using a half, round off to zero.
          Consistent with the reference implementation. */
        // should be difficult (impossible?) to get here in JS
        dataView.setUint16(0, 0);
      } else if (logicalExponent < -14) {
        /* Offset the remaining decimal places by shifting the significand, the
          value is lost. This is an implementation decision that works around the
          absence of standard half-float in the language. */
        dataView.setUint16(0, ((valu32 & 0x80000000) >> 16) | /* sign bit */ (1 << (24 + logicalExponent)), false);
      } else {
        dataView.setUint16(0, ((valu32 & 0x80000000) >> 16) | ((logicalExponent + 15) << 10) | (mantissa >> 13), false);
      }
    }
  }
}

/**
 * @param {Uint8Array} ui8a
 * @param {number} pos
 * @returns {number}
 */
function readFloat16 (ui8a, pos) {
  if (ui8a.length - pos < 2) {
    throw new Error(`${decodeErrPrefix} not enough data for float16`)
  }

  const half = (ui8a[pos] << 8) + ui8a[pos + 1];
  if (half === 0x7c00) {
    return Infinity
  }
  if (half === 0xfc00) {
    return -Infinity
  }
  if (half === 0x7e00) {
    return NaN
  }
  const exp = (half >> 10) & 0x1f;
  const mant = half & 0x3ff;
  let val;
  if (exp === 0) {
    val = mant * (2 ** -24);
  } else if (exp !== 31) {
    val = (mant + 1024) * (2 ** (exp - 25));
  /* c8 ignore next 4 */
  } else {
    // may not be possible to get here
    val = mant === 0 ? Infinity : NaN;
  }
  return (half & 0x8000) ? -val : val
}

/**
 * @param {number} inp
 */
function encodeFloat32 (inp) {
  dataView.setFloat32(0, inp, false);
}

/**
 * @param {Uint8Array} ui8a
 * @param {number} pos
 * @returns {number}
 */
function readFloat32 (ui8a, pos) {
  if (ui8a.length - pos < 4) {
    throw new Error(`${decodeErrPrefix} not enough data for float32`)
  }
  const offset = (ui8a.byteOffset || 0) + pos;
  return new DataView(ui8a.buffer, offset, 4).getFloat32(0, false)
}

/**
 * @param {number} inp
 */
function encodeFloat64 (inp) {
  dataView.setFloat64(0, inp, false);
}

/**
 * @param {Uint8Array} ui8a
 * @param {number} pos
 * @returns {number}
 */
function readFloat64 (ui8a, pos) {
  if (ui8a.length - pos < 8) {
    throw new Error(`${decodeErrPrefix} not enough data for float64`)
  }
  const offset = (ui8a.byteOffset || 0) + pos;
  return new DataView(ui8a.buffer, offset, 8).getFloat64(0, false)
}

/**
 * @param {Token} _tok1
 * @param {Token} _tok2
 * @returns {number}
 */
encodeFloat.compareTokens = encodeUint.compareTokens;
/*
encodeFloat.compareTokens = function compareTokens (_tok1, _tok2) {
  return _tok1
  throw new Error(`${encodeErrPrefix} cannot use floats as map keys`)
}
*/

/**
 * @typedef {import('../interface.js').DecodeOptions} DecodeOptions
 */

/**
 * @param {Uint8Array} data
 * @param {number} pos
 * @param {number} minor
 */
function invalidMinor (data, pos, minor) {
  throw new Error(`${decodeErrPrefix} encountered invalid minor (${minor}) for major ${data[pos] >>> 5}`)
}

/**
 * @param {string} msg
 * @returns {()=>any}
 */
function errorer (msg) {
  return () => { throw new Error(`${decodeErrPrefix} ${msg}`) }
}

/** @type {((data:Uint8Array, pos:number, minor:number, options?:DecodeOptions) => any)[]} */
const jump = [];

// unsigned integer, 0x00..0x17 (0..23)
for (let i = 0; i <= 0x17; i++) {
  jump[i] = invalidMinor; // uint.decodeUintCompact, handled by quick[]
}
jump[0x18] = decodeUint8; // unsigned integer, one-byte uint8_t follows
jump[0x19] = decodeUint16; // unsigned integer, two-byte uint16_t follows
jump[0x1a] = decodeUint32; // unsigned integer, four-byte uint32_t follows
jump[0x1b] = decodeUint64; // unsigned integer, eight-byte uint64_t follows
jump[0x1c] = invalidMinor;
jump[0x1d] = invalidMinor;
jump[0x1e] = invalidMinor;
jump[0x1f] = invalidMinor;
// negative integer, -1-0x00..-1-0x17 (-1..-24)
for (let i = 0x20; i <= 0x37; i++) {
  jump[i] = invalidMinor; // negintDecode, handled by quick[]
}
jump[0x38] = decodeNegint8; // negative integer, -1-n one-byte uint8_t for n follows
jump[0x39] = decodeNegint16; // negative integer, -1-n two-byte uint16_t for n follows
jump[0x3a] = decodeNegint32; // negative integer, -1-n four-byte uint32_t for follows
jump[0x3b] = decodeNegint64; // negative integer, -1-n eight-byte uint64_t for follows
jump[0x3c] = invalidMinor;
jump[0x3d] = invalidMinor;
jump[0x3e] = invalidMinor;
jump[0x3f] = invalidMinor;
// byte string, 0x00..0x17 bytes follow
for (let i = 0x40; i <= 0x57; i++) {
  jump[i] = decodeBytesCompact;
}
jump[0x58] = decodeBytes8; // byte string, one-byte uint8_t for n, and then n bytes follow
jump[0x59] = decodeBytes16; // byte string, two-byte uint16_t for n, and then n bytes follow
jump[0x5a] = decodeBytes32; // byte string, four-byte uint32_t for n, and then n bytes follow
jump[0x5b] = decodeBytes64; // byte string, eight-byte uint64_t for n, and then n bytes follow
jump[0x5c] = invalidMinor;
jump[0x5d] = invalidMinor;
jump[0x5e] = invalidMinor;
jump[0x5f] = errorer('indefinite length bytes/strings are not supported'); // byte string, byte strings follow, terminated by "break"
// UTF-8 string 0x00..0x17 bytes follow
for (let i = 0x60; i <= 0x77; i++) {
  jump[i] = decodeStringCompact;
}
jump[0x78] = decodeString8; // UTF-8 string, one-byte uint8_t for n, and then n bytes follow
jump[0x79] = decodeString16; // UTF-8 string, two-byte uint16_t for n, and then n bytes follow
jump[0x7a] = decodeString32; // UTF-8 string, four-byte uint32_t for n, and then n bytes follow
jump[0x7b] = decodeString64; // UTF-8 string, eight-byte uint64_t for n, and then n bytes follow
jump[0x7c] = invalidMinor;
jump[0x7d] = invalidMinor;
jump[0x7e] = invalidMinor;
jump[0x7f] = errorer('indefinite length bytes/strings are not supported'); // UTF-8 strings follow, terminated by "break"
// array, 0x00..0x17 data items follow
for (let i = 0x80; i <= 0x97; i++) {
  jump[i] = decodeArrayCompact;
}
jump[0x98] = decodeArray8; // array, one-byte uint8_t for n, and then n data items follow
jump[0x99] = decodeArray16; // array, two-byte uint16_t for n, and then n data items follow
jump[0x9a] = decodeArray32; // array, four-byte uint32_t for n, and then n data items follow
jump[0x9b] = decodeArray64; // array, eight-byte uint64_t for n, and then n data items follow
jump[0x9c] = invalidMinor;
jump[0x9d] = invalidMinor;
jump[0x9e] = invalidMinor;
jump[0x9f] = decodeArrayIndefinite; // array, data items follow, terminated by "break"
// map, 0x00..0x17 pairs of data items follow
for (let i = 0xa0; i <= 0xb7; i++) {
  jump[i] = decodeMapCompact;
}
jump[0xb8] = decodeMap8; // map, one-byte uint8_t for n, and then n pairs of data items follow
jump[0xb9] = decodeMap16; // map, two-byte uint16_t for n, and then n pairs of data items follow
jump[0xba] = decodeMap32; // map, four-byte uint32_t for n, and then n pairs of data items follow
jump[0xbb] = decodeMap64; // map, eight-byte uint64_t for n, and then n pairs of data items follow
jump[0xbc] = invalidMinor;
jump[0xbd] = invalidMinor;
jump[0xbe] = invalidMinor;
jump[0xbf] = decodeMapIndefinite; // map, pairs of data items follow, terminated by "break"
// tags
for (let i = 0xc0; i <= 0xd7; i++) {
  jump[i] = decodeTagCompact;
}
jump[0xd8] = decodeTag8;
jump[0xd9] = decodeTag16;
jump[0xda] = decodeTag32;
jump[0xdb] = decodeTag64;
jump[0xdc] = invalidMinor;
jump[0xdd] = invalidMinor;
jump[0xde] = invalidMinor;
jump[0xdf] = invalidMinor;
// 0xe0..0xf3 simple values, unsupported
for (let i = 0xe0; i <= 0xf3; i++) {
  jump[i] = errorer('simple values are not supported');
}
jump[0xf4] = invalidMinor; // false, handled by quick[]
jump[0xf5] = invalidMinor; // true, handled by quick[]
jump[0xf6] = invalidMinor; // null, handled by quick[]
jump[0xf7] = decodeUndefined; // undefined
jump[0xf8] = errorer('simple values are not supported'); // simple value, one byte follows, unsupported
jump[0xf9] = decodeFloat16; // half-precision float (two-byte IEEE 754)
jump[0xfa] = decodeFloat32; // single-precision float (four-byte IEEE 754)
jump[0xfb] = decodeFloat64; // double-precision float (eight-byte IEEE 754)
jump[0xfc] = invalidMinor;
jump[0xfd] = invalidMinor;
jump[0xfe] = invalidMinor;
jump[0xff] = decodeBreak; // "break" stop code

/** @type {Token[]} */
const quick = [];
// ints <24
for (let i = 0; i < 24; i++) {
  quick[i] = new Token(Type.uint, i, 1);
}
// negints >= -24
for (let i = -1; i >= -24; i--) {
  quick[31 - i] = new Token(Type.negint, i, 1);
}
// empty bytes
quick[0x40] = new Token(Type.bytes, new Uint8Array(0), 1);
// empty string
quick[0x60] = new Token(Type.string, '', 1);
// empty list
quick[0x80] = new Token(Type.array, 0, 1);
// empty map
quick[0xa0] = new Token(Type.map, 0, 1);
// false
quick[0xf4] = new Token(Type.false, false, 1);
// true
quick[0xf5] = new Token(Type.true, true, 1);
// null
quick[0xf6] = new Token(Type.null, null, 1);

/**
 * @param {Token} token
 * @returns {Uint8Array|undefined}
 */
function quickEncodeToken (token) {
  switch (token.type) {
    case Type.false:
      return fromArray([0xf4])
    case Type.true:
      return fromArray([0xf5])
    case Type.null:
      return fromArray([0xf6])
    case Type.bytes:
      if (!token.value.length) {
        return fromArray([0x40])
      }
      return
    case Type.string:
      if (token.value === '') {
        return fromArray([0x60])
      }
      return
    case Type.array:
      if (token.value === 0) {
        return fromArray([0x80])
      }
      /* c8 ignore next 2 */
      // shouldn't be possible if this were called when there was only one token
      return
    case Type.map:
      if (token.value === 0) {
        return fromArray([0xa0])
      }
      /* c8 ignore next 2 */
      // shouldn't be possible if this were called when there was only one token
      return
    case Type.uint:
      if (token.value < 24) {
        return fromArray([Number(token.value)])
      }
      return
    case Type.negint:
      if (token.value >= -24) {
        return fromArray([31 - Number(token.value)])
      }
  }
}

/**
 * @typedef {import('../interface.js').EncodeOptions} EncodeOptions
 * @typedef {import('../interface.js').OptionalTypeEncoder} OptionalTypeEncoder
 * @typedef {import('../interface.js').Reference} Reference
 * @typedef {import('../interface.js').StrictTypeEncoder} StrictTypeEncoder
 * @typedef {import('../interface.js').TokenTypeEncoder} TokenTypeEncoder
 * @typedef {import('../interface.js').TokenOrNestedTokens} TokenOrNestedTokens
 * @typedef {import('../interface.js').ByteWriter} ByteWriter
 */

/** @type {EncodeOptions} */
const defaultEncodeOptions = {
  float64: false,
  mapSorter,
  quickEncodeToken
};

/** @type {EncodeOptions} */
const rfc8949EncodeOptions = Object.freeze({
  float64: true,
  mapSorter: rfc8949MapSorter,
  quickEncodeToken
});

/** @returns {TokenTypeEncoder[]} */
function makeCborEncoders () {
  const encoders = [];
  encoders[Type.uint.major] = encodeUint;
  encoders[Type.negint.major] = encodeNegint;
  encoders[Type.bytes.major] = encodeBytes;
  encoders[Type.string.major] = encodeString;
  encoders[Type.array.major] = encodeArray;
  encoders[Type.map.major] = encodeMap;
  encoders[Type.tag.major] = encodeTag;
  encoders[Type.float.major] = encodeFloat;
  return encoders
}

const cborEncoders = makeCborEncoders();

const defaultWriter = new Bl();

/** @implements {Reference} */
class Ref {
  /**
   * @param {object|any[]} obj
   * @param {Reference|undefined} parent
   */
  constructor (obj, parent) {
    this.obj = obj;
    this.parent = parent;
  }

  /**
   * @param {object|any[]} obj
   * @returns {boolean}
   */
  includes (obj) {
    /** @type {Reference|undefined} */
    let p = this;
    do {
      if (p.obj === obj) {
        return true
      }
    } while (p = p.parent) // eslint-disable-line
    return false
  }

  /**
   * @param {Reference|undefined} stack
   * @param {object|any[]} obj
   * @returns {Reference}
   */
  static createCheck (stack, obj) {
    if (stack && stack.includes(obj)) {
      throw new Error(`${encodeErrPrefix} object contains circular references`)
    }
    return new Ref(obj, stack)
  }
}

const simpleTokens = {
  null: new Token(Type.null, null),
  undefined: new Token(Type.undefined, undefined),
  true: new Token(Type.true, true),
  false: new Token(Type.false, false),
  emptyArray: new Token(Type.array, 0),
  emptyMap: new Token(Type.map, 0)
};

/** @type {{[typeName: string]: StrictTypeEncoder}} */
const typeEncoders = {
  /**
   * @param {any} obj
   * @param {string} _typ
   * @param {EncodeOptions} _options
   * @param {Reference} [_refStack]
   * @returns {TokenOrNestedTokens}
   */
  number (obj, _typ, _options, _refStack) {
    if (!Number.isInteger(obj) || !Number.isSafeInteger(obj)) {
      return new Token(Type.float, obj)
    } else if (obj >= 0) {
      return new Token(Type.uint, obj)
    } else {
      return new Token(Type.negint, obj)
    }
  },

  /**
   * @param {any} obj
   * @param {string} _typ
   * @param {EncodeOptions} _options
   * @param {Reference} [_refStack]
   * @returns {TokenOrNestedTokens}
   */
  bigint (obj, _typ, _options, _refStack) {
    if (obj >= BigInt(0)) {
      return new Token(Type.uint, obj)
    } else {
      return new Token(Type.negint, obj)
    }
  },

  /**
   * @param {any} obj
   * @param {string} _typ
   * @param {EncodeOptions} _options
   * @param {Reference} [_refStack]
   * @returns {TokenOrNestedTokens}
   */
  Uint8Array (obj, _typ, _options, _refStack) {
    return new Token(Type.bytes, obj)
  },

  /**
   * @param {any} obj
   * @param {string} _typ
   * @param {EncodeOptions} _options
   * @param {Reference} [_refStack]
   * @returns {TokenOrNestedTokens}
   */
  string (obj, _typ, _options, _refStack) {
    return new Token(Type.string, obj)
  },

  /**
   * @param {any} obj
   * @param {string} _typ
   * @param {EncodeOptions} _options
   * @param {Reference} [_refStack]
   * @returns {TokenOrNestedTokens}
   */
  boolean (obj, _typ, _options, _refStack) {
    return obj ? simpleTokens.true : simpleTokens.false
  },

  /**
   * @param {any} _obj
   * @param {string} _typ
   * @param {EncodeOptions} _options
   * @param {Reference} [_refStack]
   * @returns {TokenOrNestedTokens}
   */
  null (_obj, _typ, _options, _refStack) {
    return simpleTokens.null
  },

  /**
   * @param {any} _obj
   * @param {string} _typ
   * @param {EncodeOptions} _options
   * @param {Reference} [_refStack]
   * @returns {TokenOrNestedTokens}
   */
  undefined (_obj, _typ, _options, _refStack) {
    return simpleTokens.undefined
  },

  /**
   * @param {any} obj
   * @param {string} _typ
   * @param {EncodeOptions} _options
   * @param {Reference} [_refStack]
   * @returns {TokenOrNestedTokens}
   */
  ArrayBuffer (obj, _typ, _options, _refStack) {
    return new Token(Type.bytes, new Uint8Array(obj))
  },

  /**
   * @param {any} obj
   * @param {string} _typ
   * @param {EncodeOptions} _options
   * @param {Reference} [_refStack]
   * @returns {TokenOrNestedTokens}
   */
  DataView (obj, _typ, _options, _refStack) {
    return new Token(Type.bytes, new Uint8Array(obj.buffer, obj.byteOffset, obj.byteLength))
  },

  /**
   * @param {any} obj
   * @param {string} _typ
   * @param {EncodeOptions} options
   * @param {Reference} [refStack]
   * @returns {TokenOrNestedTokens}
   */
  Array (obj, _typ, options, refStack) {
    if (!obj.length) {
      if (options.addBreakTokens === true) {
        return [simpleTokens.emptyArray, new Token(Type.break)]
      }
      return simpleTokens.emptyArray
    }
    refStack = Ref.createCheck(refStack, obj);
    const entries = [];
    let i = 0;
    for (const e of obj) {
      entries[i++] = objectToTokens(e, options, refStack);
    }
    if (options.addBreakTokens) {
      return [new Token(Type.array, obj.length), entries, new Token(Type.break)]
    }
    return [new Token(Type.array, obj.length), entries]
  },

  /**
   * @param {any} obj
   * @param {string} typ
   * @param {EncodeOptions} options
   * @param {Reference} [refStack]
   * @returns {TokenOrNestedTokens}
   */
  Object (obj, typ, options, refStack) {
    // could be an Object or a Map
    const isMap = typ !== 'Object';
    // it's slightly quicker to use Object.keys() than Object.entries()
    const keys = isMap ? obj.keys() : Object.keys(obj);
    const maxLength = isMap ? obj.size : keys.length;

    /** @type {undefined | [TokenOrNestedTokens, TokenOrNestedTokens][]} */
    let entries;

    if (maxLength) {
      // Pre-allocate the array with the expected size
      entries = new Array(maxLength);
      refStack = Ref.createCheck(refStack, obj);
      const skipUndefined = !isMap && options.ignoreUndefinedProperties;

      let i = 0;
      for (const key of keys) {
        const value = isMap ? obj.get(key) : obj[key];
        if (skipUndefined && value === undefined) {
          continue
        }
        entries[i++] = [
          objectToTokens(key, options, refStack),
          objectToTokens(value, options, refStack)
        ];
      }

      // Truncate only if properties were skipped
      if (i < maxLength) {
        entries.length = i;
      }
    }

    if (!entries?.length) {
      if (options.addBreakTokens === true) {
        return [simpleTokens.emptyMap, new Token(Type.break)]
      }
      return simpleTokens.emptyMap
    }

    sortMapEntries(entries, options);
    if (options.addBreakTokens) {
      return [new Token(Type.map, entries.length), entries, new Token(Type.break)]
    }
    return [new Token(Type.map, entries.length), entries]
  },

  /**
   * Encode a `Tagged` wrapper as a CBOR tag header followed by the encoded
   * form of the wrapped value. The value is recursively tokenised through
   * `objectToTokens()` so any registered `typeEncoders` apply to it.
   *
   * @param {any} obj
   * @param {string} _typ
   * @param {EncodeOptions} options
   * @param {Reference} [refStack]
   * @returns {TokenOrNestedTokens}
   */
  Tagged (obj, _typ, options, refStack) {
    return [
      new Token(Type.tag, obj.tag),
      objectToTokens(obj.value, options, refStack)
    ]
  }
};

typeEncoders.Map = typeEncoders.Object;
typeEncoders.Buffer = typeEncoders.Uint8Array;
for (const typ of 'Uint8Clamped Uint16 Uint32 Int8 Int16 Int32 BigUint64 BigInt64 Float32 Float64'.split(' ')) {
  typeEncoders[`${typ}Array`] = typeEncoders.DataView;
}

/**
 * @param {any} obj
 * @param {EncodeOptions} [options]
 * @param {Reference} [refStack]
 * @returns {TokenOrNestedTokens}
 */
function objectToTokens (obj, options = {}, refStack) {
  const typ = is(obj);
  const customTypeEncoder = (options && options.typeEncoders && /** @type {OptionalTypeEncoder} */ options.typeEncoders[typ]) || typeEncoders[typ];
  if (typeof customTypeEncoder === 'function') {
    const tokens = customTypeEncoder(obj, typ, options, refStack);
    if (tokens != null) {
      return tokens
    }
  }
  const typeEncoder = typeEncoders[typ];
  if (!typeEncoder) {
    throw new Error(`${encodeErrPrefix} unsupported type: ${typ}`)
  }
  return typeEncoder(obj, typ, options, refStack)
}

/*
CBOR key sorting is a mess.

The canonicalisation recommendation from https://tools.ietf.org/html/rfc7049#section-3.9
includes the wording:

> The keys in every map must be sorted lowest value to highest.
> Sorting is performed on the bytes of the representation of the key
> data items without paying attention to the 3/5 bit splitting for
> major types.
> ...
>  *  If two keys have different lengths, the shorter one sorts
      earlier;
>  *  If two keys have the same length, the one with the lower value
      in (byte-wise) lexical order sorts earlier.

1. It is not clear what "bytes of the representation of the key" means: is it
   the CBOR representation, or the binary representation of the object itself?
   Consider the int and uint difference here.
2. It is not clear what "without paying attention to" means: do we include it
   and compare on that? Or do we omit the special prefix byte, (mostly) treating
   the key in its plain binary representation form.

The FIDO 2.0: Client To Authenticator Protocol spec takes the original CBOR
wording and clarifies it according to their understanding.
https://fidoalliance.org/specs/fido-v2.0-rd-20170927/fido-client-to-authenticator-protocol-v2.0-rd-20170927.html#message-encoding

> The keys in every map must be sorted lowest value to highest. Sorting is
> performed on the bytes of the representation of the key data items without
> paying attention to the 3/5 bit splitting for major types. The sorting rules
> are:
>  * If the major types are different, the one with the lower value in numerical
>    order sorts earlier.
>  * If two keys have different lengths, the shorter one sorts earlier;
>  * If two keys have the same length, the one with the lower value in
>    (byte-wise) lexical order sorts earlier.

Some other implementations, such as borc, do a full encode then do a
length-first, byte-wise-second comparison:
https://github.com/dignifiedquire/borc/blob/b6bae8b0bcde7c3976b0f0f0957208095c392a36/src/encoder.js#L358
https://github.com/dignifiedquire/borc/blob/b6bae8b0bcde7c3976b0f0f0957208095c392a36/src/utils.js#L143-L151

This has the benefit of being able to easily handle arbitrary keys, including
complex types (maps and arrays).

We'll opt for the FIDO approach, since it affords some efficies since we don't
need a full encode of each key to determine order and can defer to the types
to determine how to most efficiently order their values (i.e. int and uint
ordering can be done on the numbers, no need for byte-wise, for example).

Recommendation: stick to single key types or you'll get into trouble, and prefer
string keys because it's much simpler that way.
*/

/**
 * @param {TokenOrNestedTokens[]} entries
 * @param {EncodeOptions} options
 */
function sortMapEntries (entries, options) {
  if (options.mapSorter) {
    entries.sort(options.mapSorter);
  }
}

/**
 * @param {(Token|Token[])[]} e1
 * @param {(Token|Token[])[]} e2
 * @returns {number}
 */
function mapSorter (e1, e2) {
  // the key position ([0]) could have a single token or an array
  // almost always it'll be a single token but complex key might get involved
  /* c8 ignore next 2 */
  const keyToken1 = Array.isArray(e1[0]) ? e1[0][0] : e1[0];
  const keyToken2 = Array.isArray(e2[0]) ? e2[0][0] : e2[0];

  // different key types
  if (keyToken1.type !== keyToken2.type) {
    return keyToken1.type.compare(keyToken2.type)
  }

  const major = keyToken1.type.major;
  // TODO: handle case where cmp === 0 but there are more keyToken e. complex type)
  const tcmp = cborEncoders[major].compareTokens(keyToken1, keyToken2);
  /* c8 ignore next 5 */
  if (tcmp === 0) {
    // duplicate key or complex type where the first token matched,
    // i.e. a map or array and we're only comparing the opening token
    console.warn('WARNING: complex key types used, CBOR key sorting guarantees are gone');
  }
  return tcmp
}

/**
 * @typedef {Token & { _keyBytes?: Uint8Array }} TokenEx
 *
 * @param {(Token|Token[])[]} e1
 * @param {(Token|Token[])[]} e2
 * @returns {number}
 */
function rfc8949MapSorter (e1, e2) {
  if (e1[0] instanceof Token && e2[0] instanceof Token) {
    const t1 = /** @type {TokenEx} */ (e1[0]);
    const t2 = /** @type {TokenEx} */ (e2[0]);

    if (!t1._keyBytes) {
      t1._keyBytes = encodeRfc8949(t1.value);
    }

    if (!t2._keyBytes) {
      t2._keyBytes = encodeRfc8949(t2.value);
    }

    return compare(t1._keyBytes, t2._keyBytes)
  }

  throw new Error('rfc8949MapSorter: complex key types are not supported yet')
}

/**
 * @param {any} data
 * @returns {Uint8Array}
 */
function encodeRfc8949 (data) {
  return encodeCustom(data, cborEncoders, rfc8949EncodeOptions)
}

/**
 * @param {ByteWriter} writer
 * @param {TokenOrNestedTokens} tokens
 * @param {TokenTypeEncoder[]} encoders
 * @param {EncodeOptions} options
 */
function tokensToEncoded (writer, tokens, encoders, options) {
  if (Array.isArray(tokens)) {
    for (const token of tokens) {
      tokensToEncoded(writer, token, encoders, options);
    }
  } else {
    encoders[tokens.type.major](writer, tokens, options);
  }
}

// CBOR major type prefixes, cached from Type for hot path performance
const MAJOR_UINT = Type.uint.majorEncoded;
const MAJOR_NEGINT = Type.negint.majorEncoded;
const MAJOR_BYTES = Type.bytes.majorEncoded;
const MAJOR_STRING = Type.string.majorEncoded;
const MAJOR_ARRAY = Type.array.majorEncoded;

// Simple value bytes (CBOR major type 7 + minor value)
const SIMPLE_FALSE = Type.float.majorEncoded | MINOR_FALSE;
const SIMPLE_TRUE = Type.float.majorEncoded | MINOR_TRUE;
const SIMPLE_NULL = Type.float.majorEncoded | MINOR_NULL;
const SIMPLE_UNDEFINED = Type.float.majorEncoded | MINOR_UNDEFINED;

const neg1b = BigInt(-1);
const pos1b = BigInt(1);

/**
 * Check if direct encoding can be used for the given options.
 * Direct encoding bypasses token creation for most values.
 * @param {EncodeOptions} options
 * @returns {boolean}
 */
function canDirectEncode (options) {
  // Cannot use direct encode with addBreakTokens (needs special break token handling).
  // Direct encode checks typeEncoders per-value, falling back to tokens as needed.
  // Maps fall back to token-based encoding for efficient key sorting.
  return options.addBreakTokens !== true
}

/**
 * Direct encode a value to the writer, bypassing token creation for most types.
 * Falls back to token-based encoding for custom type encoders.
 * @param {ByteWriter} writer
 * @param {any} data
 * @param {EncodeOptions} options
 * @param {Reference|undefined} refStack
 */
function directEncode (writer, data, options, refStack) {
  const typ = is(data);

  // Check for custom encoder for THIS specific type
  const customEncoder = options.typeEncoders && options.typeEncoders[typ];
  if (customEncoder) {
    const tokens = customEncoder(data, typ, options, refStack);
    if (tokens != null) {
      // Custom encoder returned tokens, serialize immediately
      tokensToEncoded(writer, tokens, cborEncoders, options);
      return
    }
    // Custom encoder returned null, fall through to default handling
  }

  // Direct encode based on type
  switch (typ) {
    case 'null':
      writer.push([SIMPLE_NULL]);
      return

    case 'undefined':
      writer.push([SIMPLE_UNDEFINED]);
      return

    case 'boolean':
      writer.push([data ? SIMPLE_TRUE : SIMPLE_FALSE]);
      return

    case 'number':
      if (!Number.isInteger(data) || !Number.isSafeInteger(data)) {
        // Float, use token encoder for complex float encoding
        encodeFloat(writer, new Token(Type.float, data), options);
      } else if (data >= 0) {
        encodeUintValue(writer, MAJOR_UINT, data);
      } else {
        // Negative integer
        encodeUintValue(writer, MAJOR_NEGINT, data * -1 - 1);
      }
      return

    case 'bigint':
      if (data >= BigInt(0)) {
        encodeUintValue(writer, MAJOR_UINT, data);
      } else {
        encodeUintValue(writer, MAJOR_NEGINT, data * neg1b - pos1b);
      }
      return

    case 'string': {
      const bytes = fromString(data);
      encodeUintValue(writer, MAJOR_STRING, bytes.length);
      writer.push(bytes);
      return
    }

    case 'Uint8Array':
      encodeUintValue(writer, MAJOR_BYTES, data.length);
      writer.push(data);
      return

    case 'Array':
      if (!data.length) {
        writer.push([MAJOR_ARRAY]); // Empty array: 0x80
        return
      }
      refStack = Ref.createCheck(refStack, data);
      encodeUintValue(writer, MAJOR_ARRAY, data.length);
      for (const elem of data) {
        directEncode(writer, elem, options, refStack);
      }
      return

    case 'Object':
    case 'Map':
      // Maps require key sorting, use token-based encoding for efficiency
      // (pre-encoding all keys for sorting is expensive)
      {
        const tokens = typeEncoders.Object(data, typ, options, refStack);
        tokensToEncoded(writer, tokens, cborEncoders, options);
      }
      return

    default:
    // Fall back to token-based encoding for other types (DataView, TypedArrays, etc.)
    {
      const typeEncoder = typeEncoders[typ];
      if (!typeEncoder) {
        throw new Error(`${encodeErrPrefix} unsupported type: ${typ}`)
      }
      const tokens = typeEncoder(data, typ, options, refStack);
      tokensToEncoded(writer, tokens, cborEncoders, options);
    }
  }
}

/**
 * @param {any} data
 * @param {TokenTypeEncoder[]} encoders
 * @param {EncodeOptions} options
 * @param {Uint8Array} [destination]
 * @returns {Uint8Array}
 */
function encodeCustom (data, encoders, options, destination) {
  // arg ordering is different to encodeInto for backward compatibility
  const hasDest = destination instanceof Uint8Array;
  let writeTo = hasDest ? new U8Bl(destination) : defaultWriter;

  const tokens = objectToTokens(data, options);
  if (!Array.isArray(tokens) && options.quickEncodeToken) {
    const quickBytes = options.quickEncodeToken(tokens);
    if (quickBytes) {
      if (hasDest) {
        // Copy quick bytes into destination buffer
        writeTo.push(quickBytes);
        return writeTo.toBytes()
      }
      return quickBytes
    }
    const encoder = encoders[tokens.type.major];
    if (encoder.encodedSize) {
      const size = encoder.encodedSize(tokens, options);
      if (!hasDest) {
        writeTo = new Bl(size);
      }
      encoder(writeTo, tokens, options);
      /* c8 ignore next 4 */
      // this would be a problem with encodedSize() functions
      if (writeTo.chunks.length !== 1) {
        throw new Error(`Unexpected error: pre-calculated length for ${tokens} was wrong`)
      }
      return hasDest ? writeTo.toBytes() : asU8A(writeTo.chunks[0])
    }
  }
  writeTo.reset();
  tokensToEncoded(writeTo, tokens, encoders, options);
  return writeTo.toBytes(true)
}

/**
 * @param {any} data
 * @param {EncodeOptions} [options]
 * @returns {Uint8Array}
 */
function encode$2 (data, options) {
  options = Object.assign({}, defaultEncodeOptions, options);

  // Use direct encode path when possible
  if (canDirectEncode(options)) {
    defaultWriter.reset();
    directEncode(defaultWriter, data, options, undefined);
    return defaultWriter.toBytes(true)
  }

  return encodeCustom(data, cborEncoders, options)
}

/**
 * @typedef {import('./token.js').Token} Token
 * @typedef {import('../interface.js').DecodeOptions} DecodeOptions
 * @typedef {import('../interface.js').DecodeTokenizer} DecodeTokenizer
 * @typedef {import('../interface.js').TagDecodeControl} TagDecodeControl
 */

const defaultDecodeOptions = {
  strict: false,
  allowIndefinite: true,
  allowUndefined: true,
  allowBigInt: true
};

/**
 * @implements {DecodeTokenizer}
 */
class Tokeniser {
  /**
   * @param {Uint8Array} data
   * @param {DecodeOptions} options
   */
  constructor (data, options = {}) {
    this._pos = 0;
    this.data = data;
    this.options = options;
  }

  pos () {
    return this._pos
  }

  done () {
    return this._pos >= this.data.length
  }

  next () {
    const byt = this.data[this._pos];
    let token = quick[byt];
    if (token === undefined) {
      const decoder = jump[byt];
      /* c8 ignore next 4 */
      // if we're here then there's something wrong with our jump or quick lists!
      if (!decoder) {
        throw new Error(`${decodeErrPrefix} no decoder for major type ${byt >>> 5} (byte 0x${byt.toString(16).padStart(2, '0')})`)
      }
      const minor = byt & 31;
      token = decoder(this.data, this._pos, minor, this.options);
    }
    // @ts-ignore we get to assume encodedLength is set (crossing fingers slightly)
    this._pos += token.encodedLength;
    return token
  }
}

const DONE = Symbol.for('DONE');
const BREAK = Symbol.for('BREAK');

/**
 * @param {Token} token
 * @param {DecodeTokenizer} tokeniser
 * @param {DecodeOptions} options
 * @returns {any|BREAK|DONE}
 */
function tokenToArray (token, tokeniser, options) {
  const arr = [];
  for (let i = 0; i < token.value; i++) {
    const value = tokensToObject(tokeniser, options);
    if (value === BREAK) {
      if (token.value === Infinity) {
        // normal end to indefinite length array
        break
      }
      throw new Error(`${decodeErrPrefix} got unexpected break to lengthed array`)
    }
    if (value === DONE) {
      throw new Error(`${decodeErrPrefix} found array but not enough entries (got ${i}, expected ${token.value})`)
    }
    arr[i] = value;
  }
  return arr
}

/**
 * @param {Token} token
 * @param {DecodeTokenizer} tokeniser
 * @param {DecodeOptions} options
 * @returns {any|BREAK|DONE}
 */
function tokenToMap (token, tokeniser, options) {
  const useMaps = options.useMaps === true;
  const rejectDuplicateMapKeys = options.rejectDuplicateMapKeys === true;
  const obj = useMaps ? undefined : {};
  const m = useMaps ? new Map() : undefined;
  for (let i = 0; i < token.value; i++) {
    const key = tokensToObject(tokeniser, options);
    if (key === BREAK) {
      if (token.value === Infinity) {
        // normal end to indefinite length map
        break
      }
      throw new Error(`${decodeErrPrefix} got unexpected break to lengthed map`)
    }
    if (key === DONE) {
      throw new Error(`${decodeErrPrefix} found map but not enough entries (got ${i} [no key], expected ${token.value})`)
    }
    if (!useMaps && typeof key !== 'string') {
      throw new Error(`${decodeErrPrefix} non-string keys not supported (got ${typeof key})`)
    }
    if (rejectDuplicateMapKeys) {
      // @ts-ignore
      if ((useMaps && m.has(key)) || (!useMaps && Object.hasOwn(obj, key))) {
        throw new Error(`${decodeErrPrefix} found repeat map key "${key}"`)
      }
    }
    const value = tokensToObject(tokeniser, options);
    if (value === DONE) {
      throw new Error(`${decodeErrPrefix} found map but not enough entries (got ${i} [no value], expected ${token.value})`)
    }
    if (useMaps) {
      // @ts-ignore TODO reconsider this .. maybe needs to be strict about key types
      m.set(key, value);
    } else {
      // @ts-ignore TODO reconsider this .. maybe needs to be strict about key types
      obj[key] = value;
    }
  }
  // @ts-ignore c'mon man
  return useMaps ? m : obj
}

/**
 * Generator that yields [key, value] entries from a CBOR map token.
 * Used by tag decoders that need to preserve key types (e.g., Tag 259 Map).
 * @param {Token} token - The map token
 * @param {DecodeTokenizer} tokeniser
 * @param {DecodeOptions} options
 * @returns {Generator<[any, any], void, unknown>}
 */
function * tokenToMapEntries (token, tokeniser, options) {
  for (let i = 0; i < token.value; i++) {
    const key = tokensToObject(tokeniser, options);
    if (key === BREAK) {
      if (token.value === Infinity) {
        // normal end to indefinite length map
        break
      }
      throw new Error(`${decodeErrPrefix} got unexpected break to lengthed map`)
    }
    if (key === DONE) {
      throw new Error(`${decodeErrPrefix} found map but not enough entries (got ${i} [no key], expected ${token.value})`)
    }
    const value = tokensToObject(tokeniser, options);
    if (value === DONE) {
      throw new Error(`${decodeErrPrefix} found map but not enough entries (got ${i} [no value], expected ${token.value})`)
    }
    yield [key, value];
  }
}

/**
 * Creates a TagDecodeControl object for tag decoders.
 * @param {DecodeTokenizer} tokeniser
 * @param {DecodeOptions} options
 * @returns {TagDecodeControl}
 */
function createTagDecodeControl (tokeniser, options) {
  let called = false;

  /**
   * @type {TagDecodeControl}
   */
  const decode = function () {
    if (called) {
      throw new Error(`${decodeErrPrefix} tag decode() may only be called once`)
    }
    called = true;
    const value = tokensToObject(tokeniser, options);
    if (value === DONE) {
      throw new Error(`${decodeErrPrefix} tag content missing`)
    }
    if (value === BREAK) {
      throw new Error(`${decodeErrPrefix} got unexpected break in tag content`)
    }
    return value
  };

  decode.entries = function () {
    if (called) {
      throw new Error(`${decodeErrPrefix} tag decode() may only be called once`)
    }
    called = true;

    // Get the next token and ensure it's a map
    const token = tokeniser.next();
    if (!Type.equals(token.type, Type.map)) {
      throw new Error(`${decodeErrPrefix} entries() requires map content, got ${token.type.name}`)
    }

    // Collect all entries into an array (ensures full content consumption)
    const entries = [];
    for (const entry of tokenToMapEntries(token, tokeniser, options)) {
      entries.push(entry);
    }
    return entries
  };

  // For internal tracking
  Object.defineProperty(decode, '_called', {
    get () { return called },
    enumerable: false
  });

  return decode
}

/**
 * @param {DecodeTokenizer} tokeniser
 * @param {DecodeOptions} options
 * @returns {any|BREAK|DONE}
 */
function tokensToObject (tokeniser, options) {
  // should we support array as an argument?
  // check for tokenIter[Symbol.iterator] and replace tokenIter with what that returns?
  if (tokeniser.done()) {
    return DONE
  }

  const token = tokeniser.next();

  if (Type.equals(token.type, Type.break)) {
    return BREAK
  }

  if (token.type.terminal) {
    return token.value
  }

  if (Type.equals(token.type, Type.array)) {
    return tokenToArray(token, tokeniser, options)
  }

  if (Type.equals(token.type, Type.map)) {
    return tokenToMap(token, tokeniser, options)
  }

  if (Type.equals(token.type, Type.tag)) {
    if (options.tags && typeof options.tags[token.value] === 'function') {
      const decodeControl = createTagDecodeControl(tokeniser, options);
      const result = options.tags[token.value](decodeControl);
      if (!decodeControl._called) {
        throw new Error(`${decodeErrPrefix} tag decoder must call decode() or entries()`)
      }
      return result
    }
    throw new Error(`${decodeErrPrefix} tag not supported (${token.value})`)
  }
  /* c8 ignore next */
  throw new Error('unsupported')
}

/**
 * @param {Uint8Array} data
 * @param {DecodeOptions} [options]
 * @returns {[any, Uint8Array]}
 */
function decodeFirst (data, options) {
  if (!(data instanceof Uint8Array)) {
    throw new Error(`${decodeErrPrefix} data to decode must be a Uint8Array`)
  }
  options = Object.assign({}, defaultDecodeOptions, options);
  // Convert Buffer to plain Uint8Array for faster slicing in decode path
  const u8aData = asU8A(data);
  const tokeniser = options.tokenizer || new Tokeniser(u8aData, options);
  const decoded = tokensToObject(tokeniser, options);
  if (decoded === DONE) {
    throw new Error(`${decodeErrPrefix} did not find any content to decode`)
  }
  if (decoded === BREAK) {
    throw new Error(`${decodeErrPrefix} got unexpected break`)
  }
  return [decoded, data.subarray(tokeniser.pos())]
}

/**
 * @param {Uint8Array} data
 * @param {DecodeOptions} [options]
 * @returns {any}
 */
function decode$1 (data, options) {
  const [decoded, remainder] = decodeFirst(data, options);
  if (remainder.length > 0) {
    throw new Error(`${decodeErrPrefix} too many terminals, data makes no sense`)
  }
  return decoded
}

function commonjsRequire(path) {
	throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}

var benchmark$1 = {exports: {}};

/*!
 * Benchmark.js <https://benchmarkjs.com/>
 * Copyright 2010-2016 Mathias Bynens <https://mths.be/>
 * Based on JSLitmus.js, copyright Robert Kieffer <http://broofa.com/>
 * Modified by John-David Dalton <http://allyoucanleet.com/>
 * Available under MIT license <https://mths.be/mit>
 */
var benchmark = benchmark$1.exports;

var hasRequiredBenchmark;

function requireBenchmark () {
	if (hasRequiredBenchmark) return benchmark$1.exports;
	hasRequiredBenchmark = 1;
	(function (module, exports$1) {
(function() {

		  /** Used as a safe reference for `undefined` in pre ES5 environments. */
		  var undefined$1;

		  /** Used to determine if values are of the language type Object. */
		  var objectTypes = {
		    'function': true,
		    'object': true
		  };

		  /** Used as a reference to the global object. */
		  var root = (objectTypes[typeof window] && window) || this;

		  /** Detect free variable `exports`. */
		  var freeExports = exports$1 && !exports$1.nodeType && exports$1;

		  /** Detect free variable `module`. */
		  var freeModule = module && !module.nodeType && module;

		  /** Detect free variable `global` from Node.js or Browserified code and use it as `root`. */
		  var freeGlobal = freeExports && freeModule && typeof commonjsGlobal == 'object' && commonjsGlobal;
		  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal || freeGlobal.self === freeGlobal)) {
		    root = freeGlobal;
		  }

		  /** Detect free variable `require`. */
		  var freeRequire = typeof commonjsRequire == 'function' && commonjsRequire;

		  /** Used to assign each benchmark an incremented id. */
		  var counter = 0;

		  /** Detect the popular CommonJS extension `module.exports`. */
		  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;

		  /** Used to detect primitive types. */
		  var rePrimitive = /^(?:boolean|number|string|undefined)$/;

		  /** Used to make every compiled test unique. */
		  var uidCounter = 0;

		  /** Used to assign default `context` object properties. */
		  var contextProps = [
		    'Array', 'Date', 'Function', 'Math', 'Object', 'RegExp', 'String', '_',
		    'clearTimeout', 'chrome', 'chromium', 'document', 'navigator', 'phantom',
		    'platform', 'process', 'runtime', 'setTimeout'
		  ];

		  /** Used to avoid hz of Infinity. */
		  var divisors = {
		    '1': 4096,
		    '2': 512,
		    '3': 64,
		    '4': 8,
		    '5': 0
		  };

		  /**
		   * T-Distribution two-tailed critical values for 95% confidence.
		   * For more info see http://www.itl.nist.gov/div898/handbook/eda/section3/eda3672.htm.
		   */
		  var tTable = {
		    '1':  12.706, '2':  4.303, '3':  3.182, '4':  2.776, '5':  2.571, '6':  2.447,
		    '7':  2.365,  '8':  2.306, '9':  2.262, '10': 2.228, '11': 2.201, '12': 2.179,
		    '13': 2.16,   '14': 2.145, '15': 2.131, '16': 2.12,  '17': 2.11,  '18': 2.101,
		    '19': 2.093,  '20': 2.086, '21': 2.08,  '22': 2.074, '23': 2.069, '24': 2.064,
		    '25': 2.06,   '26': 2.056, '27': 2.052, '28': 2.048, '29': 2.045, '30': 2.042,
		    'infinity': 1.96
		  };

		  /**
		   * Critical Mann-Whitney U-values for 95% confidence.
		   * For more info see http://www.saburchill.com/IBbiology/stats/003.html.
		   */
		  var uTable = {
		    '5':  [0, 1, 2],
		    '6':  [1, 2, 3, 5],
		    '7':  [1, 3, 5, 6, 8],
		    '8':  [2, 4, 6, 8, 10, 13],
		    '9':  [2, 4, 7, 10, 12, 15, 17],
		    '10': [3, 5, 8, 11, 14, 17, 20, 23],
		    '11': [3, 6, 9, 13, 16, 19, 23, 26, 30],
		    '12': [4, 7, 11, 14, 18, 22, 26, 29, 33, 37],
		    '13': [4, 8, 12, 16, 20, 24, 28, 33, 37, 41, 45],
		    '14': [5, 9, 13, 17, 22, 26, 31, 36, 40, 45, 50, 55],
		    '15': [5, 10, 14, 19, 24, 29, 34, 39, 44, 49, 54, 59, 64],
		    '16': [6, 11, 15, 21, 26, 31, 37, 42, 47, 53, 59, 64, 70, 75],
		    '17': [6, 11, 17, 22, 28, 34, 39, 45, 51, 57, 63, 67, 75, 81, 87],
		    '18': [7, 12, 18, 24, 30, 36, 42, 48, 55, 61, 67, 74, 80, 86, 93, 99],
		    '19': [7, 13, 19, 25, 32, 38, 45, 52, 58, 65, 72, 78, 85, 92, 99, 106, 113],
		    '20': [8, 14, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 90, 98, 105, 112, 119, 127],
		    '21': [8, 15, 22, 29, 36, 43, 50, 58, 65, 73, 80, 88, 96, 103, 111, 119, 126, 134, 142],
		    '22': [9, 16, 23, 30, 38, 45, 53, 61, 69, 77, 85, 93, 101, 109, 117, 125, 133, 141, 150, 158],
		    '23': [9, 17, 24, 32, 40, 48, 56, 64, 73, 81, 89, 98, 106, 115, 123, 132, 140, 149, 157, 166, 175],
		    '24': [10, 17, 25, 33, 42, 50, 59, 67, 76, 85, 94, 102, 111, 120, 129, 138, 147, 156, 165, 174, 183, 192],
		    '25': [10, 18, 27, 35, 44, 53, 62, 71, 80, 89, 98, 107, 117, 126, 135, 145, 154, 163, 173, 182, 192, 201, 211],
		    '26': [11, 19, 28, 37, 46, 55, 64, 74, 83, 93, 102, 112, 122, 132, 141, 151, 161, 171, 181, 191, 200, 210, 220, 230],
		    '27': [11, 20, 29, 38, 48, 57, 67, 77, 87, 97, 107, 118, 125, 138, 147, 158, 168, 178, 188, 199, 209, 219, 230, 240, 250],
		    '28': [12, 21, 30, 40, 50, 60, 70, 80, 90, 101, 111, 122, 132, 143, 154, 164, 175, 186, 196, 207, 218, 228, 239, 250, 261, 272],
		    '29': [13, 22, 32, 42, 52, 62, 73, 83, 94, 105, 116, 127, 138, 149, 160, 171, 182, 193, 204, 215, 226, 238, 249, 260, 271, 282, 294],
		    '30': [13, 23, 33, 43, 54, 65, 76, 87, 98, 109, 120, 131, 143, 154, 166, 177, 189, 200, 212, 223, 235, 247, 258, 270, 282, 293, 305, 317]
		  };

		  /*--------------------------------------------------------------------------*/

		  /**
		   * Create a new `Benchmark` function using the given `context` object.
		   *
		   * @static
		   * @memberOf Benchmark
		   * @param {Object} [context=root] The context object.
		   * @returns {Function} Returns a new `Benchmark` function.
		   */
		  function runInContext(context) {
		    // Exit early if unable to acquire lodash.
		    var _ = context && context._ || require('lodash') || root._;
		    if (!_) {
		      Benchmark.runInContext = runInContext;
		      return Benchmark;
		    }
		    // Avoid issues with some ES3 environments that attempt to use values, named
		    // after built-in constructors like `Object`, for the creation of literals.
		    // ES5 clears this up by stating that literals must use built-in constructors.
		    // See http://es5.github.io/#x11.1.5.
		    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;

		    /** Native constructor references. */
		    context.Array;
		        var Date = context.Date,
		        Function = context.Function,
		        Math = context.Math,
		        Object = context.Object;
		        context.RegExp;
		        var String = context.String;

		    /** Used for `Array` and `Object` method references. */
		    var arrayRef = [],
		        objectProto = Object.prototype;

		    /** Native method shortcuts. */
		    var abs = Math.abs,
		        clearTimeout = context.clearTimeout,
		        floor = Math.floor;
		        Math.log;
		        var max = Math.max,
		        min = Math.min,
		        pow = Math.pow,
		        push = arrayRef.push;
		        context.setTimeout;
		        var shift = arrayRef.shift,
		        slice = arrayRef.slice,
		        sqrt = Math.sqrt;
		        objectProto.toString;
		        var unshift = arrayRef.unshift;

		    /** Used to avoid inclusion in Browserified bundles. */
		    var req = require;

		    /** Detect DOM document object. */
		    var doc = isHostType(context, 'document') && context.document;

		    /** Used to access Wade Simmons' Node.js `microtime` module. */
		    var microtimeObject = req('microtime');

		    /** Used to access Node.js's high resolution timer. */
		    var processObject = isHostType(context, 'process') && context.process;

		    /** Used to prevent a `removeChild` memory leak in IE < 9. */
		    var trash = doc && doc.createElement('div');

		    /** Used to integrity check compiled tests. */
		    var uid = 'uid' + _.now();

		    /** Used to avoid infinite recursion when methods call each other. */
		    var calledBy = {};

		    /**
		     * An object used to flag environments/features.
		     *
		     * @static
		     * @memberOf Benchmark
		     * @type Object
		     */
		    var support = {};

		    (function() {

		      /**
		       * Detect if running in a browser environment.
		       *
		       * @memberOf Benchmark.support
		       * @type boolean
		       */
		      support.browser = doc && isHostType(context, 'navigator') && !isHostType(context, 'phantom');

		      /**
		       * Detect if the Timers API exists.
		       *
		       * @memberOf Benchmark.support
		       * @type boolean
		       */
		      support.timeout = isHostType(context, 'setTimeout') && isHostType(context, 'clearTimeout');

		      /**
		       * Detect if function decompilation is support.
		       *
		       * @name decompilation
		       * @memberOf Benchmark.support
		       * @type boolean
		       */
		      try {
		        // Safari 2.x removes commas in object literals from `Function#toString` results.
		        // See http://webk.it/11609 for more details.
		        // Firefox 3.6 and Opera 9.25 strip grouping parentheses from `Function#toString` results.
		        // See http://bugzil.la/559438 for more details.
		        support.decompilation = Function(
		          ('return (' + (function(x) { return { 'x': '' + (1 + x) + '', 'y': 0 }; }) + ')')
		          // Avoid issues with code added by Istanbul.
		          .replace(/__cov__[^;]+;/g, '')
		        )()(0).x === '1';
		      } catch(e) {
		        support.decompilation = false;
		      }
		    }());

		    /**
		     * Timer object used by `clock()` and `Deferred#resolve`.
		     *
		     * @private
		     * @type Object
		     */
		    var timer = {

		      /**
		       * The timer namespace object or constructor.
		       *
		       * @private
		       * @memberOf timer
		       * @type {Function|Object}
		       */
		      'ns': Date,

		      /**
		       * Starts the deferred timer.
		       *
		       * @private
		       * @memberOf timer
		       * @param {Object} deferred The deferred instance.
		       */
		      'start': null, // Lazy defined in `clock()`.

		      /**
		       * Stops the deferred timer.
		       *
		       * @private
		       * @memberOf timer
		       * @param {Object} deferred The deferred instance.
		       */
		      'stop': null // Lazy defined in `clock()`.
		    };

		    /*------------------------------------------------------------------------*/

		    /**
		     * The Benchmark constructor.
		     *
		     * Note: The Benchmark constructor exposes a handful of lodash methods to
		     * make working with arrays, collections, and objects easier. The lodash
		     * methods are:
		     * [`each/forEach`](https://lodash.com/docs#forEach), [`forOwn`](https://lodash.com/docs#forOwn),
		     * [`has`](https://lodash.com/docs#has), [`indexOf`](https://lodash.com/docs#indexOf),
		     * [`map`](https://lodash.com/docs#map), and [`reduce`](https://lodash.com/docs#reduce)
		     *
		     * @constructor
		     * @param {string} name A name to identify the benchmark.
		     * @param {Function|string} fn The test to benchmark.
		     * @param {Object} [options={}] Options object.
		     * @example
		     *
		     * // basic usage (the `new` operator is optional)
		     * var bench = new Benchmark(fn);
		     *
		     * // or using a name first
		     * var bench = new Benchmark('foo', fn);
		     *
		     * // or with options
		     * var bench = new Benchmark('foo', fn, {
		     *
		     *   // displayed by `Benchmark#toString` if `name` is not available
		     *   'id': 'xyz',
		     *
		     *   // called when the benchmark starts running
		     *   'onStart': onStart,
		     *
		     *   // called after each run cycle
		     *   'onCycle': onCycle,
		     *
		     *   // called when aborted
		     *   'onAbort': onAbort,
		     *
		     *   // called when a test errors
		     *   'onError': onError,
		     *
		     *   // called when reset
		     *   'onReset': onReset,
		     *
		     *   // called when the benchmark completes running
		     *   'onComplete': onComplete,
		     *
		     *   // compiled/called before the test loop
		     *   'setup': setup,
		     *
		     *   // compiled/called after the test loop
		     *   'teardown': teardown
		     * });
		     *
		     * // or name and options
		     * var bench = new Benchmark('foo', {
		     *
		     *   // a flag to indicate the benchmark is deferred
		     *   'defer': true,
		     *
		     *   // benchmark test function
		     *   'fn': function(deferred) {
		     *     // call `Deferred#resolve` when the deferred test is finished
		     *     deferred.resolve();
		     *   }
		     * });
		     *
		     * // or options only
		     * var bench = new Benchmark({
		     *
		     *   // benchmark name
		     *   'name': 'foo',
		     *
		     *   // benchmark test as a string
		     *   'fn': '[1,2,3,4].sort()'
		     * });
		     *
		     * // a test's `this` binding is set to the benchmark instance
		     * var bench = new Benchmark('foo', function() {
		     *   'My name is '.concat(this.name); // "My name is foo"
		     * });
		     */
		    function Benchmark(name, fn, options) {
		      var bench = this;

		      // Allow instance creation without the `new` operator.
		      if (!(bench instanceof Benchmark)) {
		        return new Benchmark(name, fn, options);
		      }
		      // Juggle arguments.
		      if (_.isPlainObject(name)) {
		        // 1 argument (options).
		        options = name;
		      }
		      else if (_.isFunction(name)) {
		        // 2 arguments (fn, options).
		        options = fn;
		        fn = name;
		      }
		      else if (_.isPlainObject(fn)) {
		        // 2 arguments (name, options).
		        options = fn;
		        fn = null;
		        bench.name = name;
		      }
		      else {
		        // 3 arguments (name, fn [, options]).
		        bench.name = name;
		      }
		      setOptions(bench, options);

		      bench.id || (bench.id = ++counter);
		      bench.fn == null && (bench.fn = fn);

		      bench.stats = cloneDeep(bench.stats);
		      bench.times = cloneDeep(bench.times);
		    }

		    /**
		     * The Deferred constructor.
		     *
		     * @constructor
		     * @memberOf Benchmark
		     * @param {Object} clone The cloned benchmark instance.
		     */
		    function Deferred(clone) {
		      var deferred = this;
		      if (!(deferred instanceof Deferred)) {
		        return new Deferred(clone);
		      }
		      deferred.benchmark = clone;
		      clock(deferred);
		    }

		    /**
		     * The Event constructor.
		     *
		     * @constructor
		     * @memberOf Benchmark
		     * @param {Object|string} type The event type.
		     */
		    function Event(type) {
		      var event = this;
		      if (type instanceof Event) {
		        return type;
		      }
		      return (event instanceof Event)
		        ? _.assign(event, { 'timeStamp': _.now() }, typeof type == 'string' ? { 'type': type } : type)
		        : new Event(type);
		    }

		    /**
		     * The Suite constructor.
		     *
		     * Note: Each Suite instance has a handful of wrapped lodash methods to
		     * make working with Suites easier. The wrapped lodash methods are:
		     * [`each/forEach`](https://lodash.com/docs#forEach), [`indexOf`](https://lodash.com/docs#indexOf),
		     * [`map`](https://lodash.com/docs#map), and [`reduce`](https://lodash.com/docs#reduce)
		     *
		     * @constructor
		     * @memberOf Benchmark
		     * @param {string} name A name to identify the suite.
		     * @param {Object} [options={}] Options object.
		     * @example
		     *
		     * // basic usage (the `new` operator is optional)
		     * var suite = new Benchmark.Suite;
		     *
		     * // or using a name first
		     * var suite = new Benchmark.Suite('foo');
		     *
		     * // or with options
		     * var suite = new Benchmark.Suite('foo', {
		     *
		     *   // called when the suite starts running
		     *   'onStart': onStart,
		     *
		     *   // called between running benchmarks
		     *   'onCycle': onCycle,
		     *
		     *   // called when aborted
		     *   'onAbort': onAbort,
		     *
		     *   // called when a test errors
		     *   'onError': onError,
		     *
		     *   // called when reset
		     *   'onReset': onReset,
		     *
		     *   // called when the suite completes running
		     *   'onComplete': onComplete
		     * });
		     */
		    function Suite(name, options) {
		      var suite = this;

		      // Allow instance creation without the `new` operator.
		      if (!(suite instanceof Suite)) {
		        return new Suite(name, options);
		      }
		      // Juggle arguments.
		      if (_.isPlainObject(name)) {
		        // 1 argument (options).
		        options = name;
		      } else {
		        // 2 arguments (name [, options]).
		        suite.name = name;
		      }
		      setOptions(suite, options);
		    }

		    /*------------------------------------------------------------------------*/

		    /**
		     * A specialized version of `_.cloneDeep` which only clones arrays and plain
		     * objects assigning all other values by reference.
		     *
		     * @private
		     * @param {*} value The value to clone.
		     * @returns {*} The cloned value.
		     */
		    var cloneDeep = _.partial(_.cloneDeepWith, _, function(value) {
		      // Only clone primitives, arrays, and plain objects.
		      if (!_.isArray(value) && !_.isPlainObject(value)) {
		        return value;
		      }
		    });

		    /**
		     * Creates a function from the given arguments string and body.
		     *
		     * @private
		     * @param {string} args The comma separated function arguments.
		     * @param {string} body The function body.
		     * @returns {Function} The new function.
		     */
		    function createFunction() {
		      // Lazy define.
		      createFunction = function(args, body) {
		        var result,
		            anchor = Benchmark,
		            prop = uid + 'createFunction';

		        runScript(('Benchmark.') + prop + '=function(' + args + '){' + body + '}');
		        result = anchor[prop];
		        delete anchor[prop];
		        return result;
		      };
		      // Fix JaegerMonkey bug.
		      // For more information see http://bugzil.la/639720.
		      createFunction = support.browser && (createFunction('', 'return"' + uid + '"') || _.noop)() == uid ? createFunction : Function;
		      return createFunction.apply(null, arguments);
		    }

		    /**
		     * Delay the execution of a function based on the benchmark's `delay` property.
		     *
		     * @private
		     * @param {Object} bench The benchmark instance.
		     * @param {Object} fn The function to execute.
		     */
		    function delay(bench, fn) {
		      bench._timerId = _.delay(fn, bench.delay * 1e3);
		    }

		    /**
		     * Destroys the given element.
		     *
		     * @private
		     * @param {Element} element The element to destroy.
		     */
		    function destroyElement(element) {
		      trash.appendChild(element);
		      trash.innerHTML = '';
		    }

		    /**
		     * Gets the name of the first argument from a function's source.
		     *
		     * @private
		     * @param {Function} fn The function.
		     * @returns {string} The argument name.
		     */
		    function getFirstArgument(fn) {
		      return (!_.has(fn, 'toString') &&
		        (/^[\s(]*function[^(]*\(([^\s,)]+)/.exec(fn) || 0)[1]) || '';
		    }

		    /**
		     * Computes the arithmetic mean of a sample.
		     *
		     * @private
		     * @param {Array} sample The sample.
		     * @returns {number} The mean.
		     */
		    function getMean(sample) {
		      return (_.reduce(sample, function(sum, x) {
		        return sum + x;
		      }) / sample.length) || 0;
		    }

		    /**
		     * Gets the source code of a function.
		     *
		     * @private
		     * @param {Function} fn The function.
		     * @returns {string} The function's source code.
		     */
		    function getSource(fn) {
		      var result = '';
		      if (isStringable(fn)) {
		        result = String(fn);
		      } else if (support.decompilation) {
		        // Escape the `{` for Firefox 1.
		        result = _.result(/^[^{]+\{([\s\S]*)\}\s*$/.exec(fn), 1);
		      }
		      // Trim string.
		      result = (result || '').replace(/^\s+|\s+$/g, '');

		      // Detect strings containing only the "use strict" directive.
		      return /^(?:\/\*+[\w\W]*?\*\/|\/\/.*?[\n\r\u2028\u2029]|\s)*(["'])use strict\1;?$/.test(result)
		        ? ''
		        : result;
		    }

		    /**
		     * Host objects can return type values that are different from their actual
		     * data type. The objects we are concerned with usually return non-primitive
		     * types of "object", "function", or "unknown".
		     *
		     * @private
		     * @param {*} object The owner of the property.
		     * @param {string} property The property to check.
		     * @returns {boolean} Returns `true` if the property value is a non-primitive, else `false`.
		     */
		    function isHostType(object, property) {
		      if (object == null) {
		        return false;
		      }
		      var type = typeof object[property];
		      return !rePrimitive.test(type) && (type != 'object' || !!object[property]);
		    }

		    /**
		     * Checks if a value can be safely coerced to a string.
		     *
		     * @private
		     * @param {*} value The value to check.
		     * @returns {boolean} Returns `true` if the value can be coerced, else `false`.
		     */
		    function isStringable(value) {
		      return _.isString(value) || (_.has(value, 'toString') && _.isFunction(value.toString));
		    }

		    /**
		     * A wrapper around `require` to suppress `module missing` errors.
		     *
		     * @private
		     * @param {string} id The module id.
		     * @returns {*} The exported module or `null`.
		     */
		    function require(id) {
		      try {
		        var result = freeExports && freeRequire(id);
		      } catch(e) {}
		      return result || null;
		    }

		    /**
		     * Runs a snippet of JavaScript via script injection.
		     *
		     * @private
		     * @param {string} code The code to run.
		     */
		    function runScript(code) {
		      var anchor = Benchmark,
		          script = doc.createElement('script'),
		          sibling = doc.getElementsByTagName('script')[0],
		          parent = sibling.parentNode,
		          prop = uid + 'runScript',
		          prefix = '(' + ('Benchmark.') + prop + '||function(){})();';

		      // Firefox 2.0.0.2 cannot use script injection as intended because it executes
		      // asynchronously, but that's OK because script injection is only used to avoid
		      // the previously commented JaegerMonkey bug.
		      try {
		        // Remove the inserted script *before* running the code to avoid differences
		        // in the expected script element count/order of the document.
		        script.appendChild(doc.createTextNode(prefix + code));
		        anchor[prop] = function() { destroyElement(script); };
		      } catch(e) {
		        parent = parent.cloneNode(false);
		        sibling = null;
		        script.text = code;
		      }
		      parent.insertBefore(script, sibling);
		      delete anchor[prop];
		    }

		    /**
		     * A helper function for setting options/event handlers.
		     *
		     * @private
		     * @param {Object} object The benchmark or suite instance.
		     * @param {Object} [options={}] Options object.
		     */
		    function setOptions(object, options) {
		      options = object.options = _.assign({}, cloneDeep(object.constructor.options), cloneDeep(options));

		      _.forOwn(options, function(value, key) {
		        if (value != null) {
		          // Add event listeners.
		          if (/^on[A-Z]/.test(key)) {
		            _.each(key.split(' '), function(key) {
		              object.on(key.slice(2).toLowerCase(), value);
		            });
		          } else if (!_.has(object, key)) {
		            object[key] = cloneDeep(value);
		          }
		        }
		      });
		    }

		    /*------------------------------------------------------------------------*/

		    /**
		     * Handles cycling/completing the deferred benchmark.
		     *
		     * @memberOf Benchmark.Deferred
		     */
		    function resolve() {
		      var deferred = this,
		          clone = deferred.benchmark,
		          bench = clone._original;

		      if (bench.aborted) {
		        // cycle() -> clone cycle/complete event -> compute()'s invoked bench.run() cycle/complete.
		        deferred.teardown();
		        clone.running = false;
		        cycle(deferred);
		      }
		      else if (++deferred.cycles < clone.count) {
		        clone.compiled.call(deferred, context, timer);
		      }
		      else {
		        timer.stop(deferred);
		        deferred.teardown();
		        delay(clone, function() { cycle(deferred); });
		      }
		    }

		    /*------------------------------------------------------------------------*/

		    /**
		     * A generic `Array#filter` like method.
		     *
		     * @static
		     * @memberOf Benchmark
		     * @param {Array} array The array to iterate over.
		     * @param {Function|string} callback The function/alias called per iteration.
		     * @returns {Array} A new array of values that passed callback filter.
		     * @example
		     *
		     * // get odd numbers
		     * Benchmark.filter([1, 2, 3, 4, 5], function(n) {
		     *   return n % 2;
		     * }); // -> [1, 3, 5];
		     *
		     * // get fastest benchmarks
		     * Benchmark.filter(benches, 'fastest');
		     *
		     * // get slowest benchmarks
		     * Benchmark.filter(benches, 'slowest');
		     *
		     * // get benchmarks that completed without erroring
		     * Benchmark.filter(benches, 'successful');
		     */
		    function filter(array, callback) {
		      if (callback === 'successful') {
		        // Callback to exclude those that are errored, unrun, or have hz of Infinity.
		        callback = function(bench) {
		          return bench.cycles && _.isFinite(bench.hz) && !bench.error;
		        };
		      }
		      else if (callback === 'fastest' || callback === 'slowest') {
		        // Get successful, sort by period + margin of error, and filter fastest/slowest.
		        var result = filter(array, 'successful').sort(function(a, b) {
		          a = a.stats; b = b.stats;
		          return (a.mean + a.moe > b.mean + b.moe ? 1 : -1) * (callback === 'fastest' ? 1 : -1);
		        });

		        return _.filter(result, function(bench) {
		          return result[0].compare(bench) == 0;
		        });
		      }
		      return _.filter(array, callback);
		    }

		    /**
		     * Converts a number to a more readable comma-separated string representation.
		     *
		     * @static
		     * @memberOf Benchmark
		     * @param {number} number The number to convert.
		     * @returns {string} The more readable string representation.
		     */
		    function formatNumber(number) {
		      number = String(number).split('.');
		      return number[0].replace(/(?=(?:\d{3})+$)(?!\b)/g, ',') +
		        (number[1] ? '.' + number[1] : '');
		    }

		    /**
		     * Invokes a method on all items in an array.
		     *
		     * @static
		     * @memberOf Benchmark
		     * @param {Array} benches Array of benchmarks to iterate over.
		     * @param {Object|string} name The name of the method to invoke OR options object.
		     * @param {...*} [args] Arguments to invoke the method with.
		     * @returns {Array} A new array of values returned from each method invoked.
		     * @example
		     *
		     * // invoke `reset` on all benchmarks
		     * Benchmark.invoke(benches, 'reset');
		     *
		     * // invoke `emit` with arguments
		     * Benchmark.invoke(benches, 'emit', 'complete', listener);
		     *
		     * // invoke `run(true)`, treat benchmarks as a queue, and register invoke callbacks
		     * Benchmark.invoke(benches, {
		     *
		     *   // invoke the `run` method
		     *   'name': 'run',
		     *
		     *   // pass a single argument
		     *   'args': true,
		     *
		     *   // treat as queue, removing benchmarks from front of `benches` until empty
		     *   'queued': true,
		     *
		     *   // called before any benchmarks have been invoked.
		     *   'onStart': onStart,
		     *
		     *   // called between invoking benchmarks
		     *   'onCycle': onCycle,
		     *
		     *   // called after all benchmarks have been invoked.
		     *   'onComplete': onComplete
		     * });
		     */
		    function invoke(benches, name) {
		      var args,
		          bench,
		          queued,
		          index = -1,
		          eventProps = { 'currentTarget': benches },
		          options = { 'onStart': _.noop, 'onCycle': _.noop, 'onComplete': _.noop },
		          result = _.toArray(benches);

		      /**
		       * Invokes the method of the current object and if synchronous, fetches the next.
		       */
		      function execute() {
		        var listeners,
		            async = isAsync(bench);

		        if (async) {
		          // Use `getNext` as the first listener.
		          bench.on('complete', getNext);
		          listeners = bench.events.complete;
		          listeners.splice(0, 0, listeners.pop());
		        }
		        // Execute method.
		        result[index] = _.isFunction(bench && bench[name]) ? bench[name].apply(bench, args) : undefined$1;
		        // If synchronous return `true` until finished.
		        return !async && getNext();
		      }

		      /**
		       * Fetches the next bench or executes `onComplete` callback.
		       */
		      function getNext(event) {
		        var cycleEvent,
		            last = bench,
		            async = isAsync(last);

		        if (async) {
		          last.off('complete', getNext);
		          last.emit('complete');
		        }
		        // Emit "cycle" event.
		        eventProps.type = 'cycle';
		        eventProps.target = last;
		        cycleEvent = Event(eventProps);
		        options.onCycle.call(benches, cycleEvent);

		        // Choose next benchmark if not exiting early.
		        if (!cycleEvent.aborted && raiseIndex() !== false) {
		          bench = queued ? benches[0] : result[index];
		          if (isAsync(bench)) {
		            delay(bench, execute);
		          }
		          else if (async) {
		            // Resume execution if previously asynchronous but now synchronous.
		            while (execute()) {}
		          }
		          else {
		            // Continue synchronous execution.
		            return true;
		          }
		        } else {
		          // Emit "complete" event.
		          eventProps.type = 'complete';
		          options.onComplete.call(benches, Event(eventProps));
		        }
		        // When used as a listener `event.aborted = true` will cancel the rest of
		        // the "complete" listeners because they were already called above and when
		        // used as part of `getNext` the `return false` will exit the execution while-loop.
		        if (event) {
		          event.aborted = true;
		        } else {
		          return false;
		        }
		      }

		      /**
		       * Checks if invoking `Benchmark#run` with asynchronous cycles.
		       */
		      function isAsync(object) {
		        // Avoid using `instanceof` here because of IE memory leak issues with host objects.
		        var async = args[0] && args[0].async;
		        return name == 'run' && (object instanceof Benchmark) &&
		          ((async == null ? object.options.async : async) && support.timeout || object.defer);
		      }

		      /**
		       * Raises `index` to the next defined index or returns `false`.
		       */
		      function raiseIndex() {
		        index++;

		        // If queued remove the previous bench.
		        if (queued && index > 0) {
		          shift.call(benches);
		        }
		        // If we reached the last index then return `false`.
		        return (queued ? benches.length : index < result.length)
		          ? index
		          : (index = false);
		      }
		      // Juggle arguments.
		      if (_.isString(name)) {
		        // 2 arguments (array, name).
		        args = slice.call(arguments, 2);
		      } else {
		        // 2 arguments (array, options).
		        options = _.assign(options, name);
		        name = options.name;
		        args = _.isArray(args = 'args' in options ? options.args : []) ? args : [args];
		        queued = options.queued;
		      }
		      // Start iterating over the array.
		      if (raiseIndex() !== false) {
		        // Emit "start" event.
		        bench = result[index];
		        eventProps.type = 'start';
		        eventProps.target = bench;
		        options.onStart.call(benches, Event(eventProps));

		        // End early if the suite was aborted in an "onStart" listener.
		        if (name == 'run' && (benches instanceof Suite) && benches.aborted) {
		          // Emit "cycle" event.
		          eventProps.type = 'cycle';
		          options.onCycle.call(benches, Event(eventProps));
		          // Emit "complete" event.
		          eventProps.type = 'complete';
		          options.onComplete.call(benches, Event(eventProps));
		        }
		        // Start method execution.
		        else {
		          if (isAsync(bench)) {
		            delay(bench, execute);
		          } else {
		            while (execute()) {}
		          }
		        }
		      }
		      return result;
		    }

		    /**
		     * Creates a string of joined array values or object key-value pairs.
		     *
		     * @static
		     * @memberOf Benchmark
		     * @param {Array|Object} object The object to operate on.
		     * @param {string} [separator1=','] The separator used between key-value pairs.
		     * @param {string} [separator2=': '] The separator used between keys and values.
		     * @returns {string} The joined result.
		     */
		    function join(object, separator1, separator2) {
		      var result = [],
		          length = (object = Object(object)).length,
		          arrayLike = length === length >>> 0;

		      separator2 || (separator2 = ': ');
		      _.each(object, function(value, key) {
		        result.push(arrayLike ? value : key + separator2 + value);
		      });
		      return result.join(separator1 || ',');
		    }

		    /*------------------------------------------------------------------------*/

		    /**
		     * Aborts all benchmarks in the suite.
		     *
		     * @name abort
		     * @memberOf Benchmark.Suite
		     * @returns {Object} The suite instance.
		     */
		    function abortSuite() {
		      var event,
		          suite = this,
		          resetting = calledBy.resetSuite;

		      if (suite.running) {
		        event = Event('abort');
		        suite.emit(event);
		        if (!event.cancelled || resetting) {
		          // Avoid infinite recursion.
		          calledBy.abortSuite = true;
		          suite.reset();
		          delete calledBy.abortSuite;

		          if (!resetting) {
		            suite.aborted = true;
		            invoke(suite, 'abort');
		          }
		        }
		      }
		      return suite;
		    }

		    /**
		     * Adds a test to the benchmark suite.
		     *
		     * @memberOf Benchmark.Suite
		     * @param {string} name A name to identify the benchmark.
		     * @param {Function|string} fn The test to benchmark.
		     * @param {Object} [options={}] Options object.
		     * @returns {Object} The suite instance.
		     * @example
		     *
		     * // basic usage
		     * suite.add(fn);
		     *
		     * // or using a name first
		     * suite.add('foo', fn);
		     *
		     * // or with options
		     * suite.add('foo', fn, {
		     *   'onCycle': onCycle,
		     *   'onComplete': onComplete
		     * });
		     *
		     * // or name and options
		     * suite.add('foo', {
		     *   'fn': fn,
		     *   'onCycle': onCycle,
		     *   'onComplete': onComplete
		     * });
		     *
		     * // or options only
		     * suite.add({
		     *   'name': 'foo',
		     *   'fn': fn,
		     *   'onCycle': onCycle,
		     *   'onComplete': onComplete
		     * });
		     */
		    function add(name, fn, options) {
		      var suite = this,
		          bench = new Benchmark(name, fn, options),
		          event = Event({ 'type': 'add', 'target': bench });

		      if (suite.emit(event), !event.cancelled) {
		        suite.push(bench);
		      }
		      return suite;
		    }

		    /**
		     * Creates a new suite with cloned benchmarks.
		     *
		     * @name clone
		     * @memberOf Benchmark.Suite
		     * @param {Object} options Options object to overwrite cloned options.
		     * @returns {Object} The new suite instance.
		     */
		    function cloneSuite(options) {
		      var suite = this,
		          result = new suite.constructor(_.assign({}, suite.options, options));

		      // Copy own properties.
		      _.forOwn(suite, function(value, key) {
		        if (!_.has(result, key)) {
		          result[key] = _.isFunction(_.get(value, 'clone'))
		            ? value.clone()
		            : cloneDeep(value);
		        }
		      });
		      return result;
		    }

		    /**
		     * An `Array#filter` like method.
		     *
		     * @name filter
		     * @memberOf Benchmark.Suite
		     * @param {Function|string} callback The function/alias called per iteration.
		     * @returns {Object} A new suite of benchmarks that passed callback filter.
		     */
		    function filterSuite(callback) {
		      var suite = this,
		          result = new suite.constructor(suite.options);

		      result.push.apply(result, filter(suite, callback));
		      return result;
		    }

		    /**
		     * Resets all benchmarks in the suite.
		     *
		     * @name reset
		     * @memberOf Benchmark.Suite
		     * @returns {Object} The suite instance.
		     */
		    function resetSuite() {
		      var event,
		          suite = this,
		          aborting = calledBy.abortSuite;

		      if (suite.running && !aborting) {
		        // No worries, `resetSuite()` is called within `abortSuite()`.
		        calledBy.resetSuite = true;
		        suite.abort();
		        delete calledBy.resetSuite;
		      }
		      // Reset if the state has changed.
		      else if ((suite.aborted || suite.running) &&
		          (suite.emit(event = Event('reset')), !event.cancelled)) {
		        suite.aborted = suite.running = false;
		        if (!aborting) {
		          invoke(suite, 'reset');
		        }
		      }
		      return suite;
		    }

		    /**
		     * Runs the suite.
		     *
		     * @name run
		     * @memberOf Benchmark.Suite
		     * @param {Object} [options={}] Options object.
		     * @returns {Object} The suite instance.
		     * @example
		     *
		     * // basic usage
		     * suite.run();
		     *
		     * // or with options
		     * suite.run({ 'async': true, 'queued': true });
		     */
		    function runSuite(options) {
		      var suite = this;

		      suite.reset();
		      suite.running = true;
		      options || (options = {});

		      invoke(suite, {
		        'name': 'run',
		        'args': options,
		        'queued': options.queued,
		        'onStart': function(event) {
		          suite.emit(event);
		        },
		        'onCycle': function(event) {
		          var bench = event.target;
		          if (bench.error) {
		            suite.emit({ 'type': 'error', 'target': bench });
		          }
		          suite.emit(event);
		          event.aborted = suite.aborted;
		        },
		        'onComplete': function(event) {
		          suite.running = false;
		          suite.emit(event);
		        }
		      });
		      return suite;
		    }

		    /*------------------------------------------------------------------------*/

		    /**
		     * Executes all registered listeners of the specified event type.
		     *
		     * @memberOf Benchmark, Benchmark.Suite
		     * @param {Object|string} type The event type or object.
		     * @param {...*} [args] Arguments to invoke the listener with.
		     * @returns {*} Returns the return value of the last listener executed.
		     */
		    function emit(type) {
		      var listeners,
		          object = this,
		          event = Event(type),
		          events = object.events,
		          args = (arguments[0] = event, arguments);

		      event.currentTarget || (event.currentTarget = object);
		      event.target || (event.target = object);
		      delete event.result;

		      if (events && (listeners = _.has(events, event.type) && events[event.type])) {
		        _.each(listeners.slice(), function(listener) {
		          if ((event.result = listener.apply(object, args)) === false) {
		            event.cancelled = true;
		          }
		          return !event.aborted;
		        });
		      }
		      return event.result;
		    }

		    /**
		     * Returns an array of event listeners for a given type that can be manipulated
		     * to add or remove listeners.
		     *
		     * @memberOf Benchmark, Benchmark.Suite
		     * @param {string} type The event type.
		     * @returns {Array} The listeners array.
		     */
		    function listeners(type) {
		      var object = this,
		          events = object.events || (object.events = {});

		      return _.has(events, type) ? events[type] : (events[type] = []);
		    }

		    /**
		     * Unregisters a listener for the specified event type(s),
		     * or unregisters all listeners for the specified event type(s),
		     * or unregisters all listeners for all event types.
		     *
		     * @memberOf Benchmark, Benchmark.Suite
		     * @param {string} [type] The event type.
		     * @param {Function} [listener] The function to unregister.
		     * @returns {Object} The current instance.
		     * @example
		     *
		     * // unregister a listener for an event type
		     * bench.off('cycle', listener);
		     *
		     * // unregister a listener for multiple event types
		     * bench.off('start cycle', listener);
		     *
		     * // unregister all listeners for an event type
		     * bench.off('cycle');
		     *
		     * // unregister all listeners for multiple event types
		     * bench.off('start cycle complete');
		     *
		     * // unregister all listeners for all event types
		     * bench.off();
		     */
		    function off(type, listener) {
		      var object = this,
		          events = object.events;

		      if (!events) {
		        return object;
		      }
		      _.each(type ? type.split(' ') : events, function(listeners, type) {
		        var index;
		        if (typeof listeners == 'string') {
		          type = listeners;
		          listeners = _.has(events, type) && events[type];
		        }
		        if (listeners) {
		          if (listener) {
		            index = _.indexOf(listeners, listener);
		            if (index > -1) {
		              listeners.splice(index, 1);
		            }
		          } else {
		            listeners.length = 0;
		          }
		        }
		      });
		      return object;
		    }

		    /**
		     * Registers a listener for the specified event type(s).
		     *
		     * @memberOf Benchmark, Benchmark.Suite
		     * @param {string} type The event type.
		     * @param {Function} listener The function to register.
		     * @returns {Object} The current instance.
		     * @example
		     *
		     * // register a listener for an event type
		     * bench.on('cycle', listener);
		     *
		     * // register a listener for multiple event types
		     * bench.on('start cycle', listener);
		     */
		    function on(type, listener) {
		      var object = this,
		          events = object.events || (object.events = {});

		      _.each(type.split(' '), function(type) {
		        (_.has(events, type)
		          ? events[type]
		          : (events[type] = [])
		        ).push(listener);
		      });
		      return object;
		    }

		    /*------------------------------------------------------------------------*/

		    /**
		     * Aborts the benchmark without recording times.
		     *
		     * @memberOf Benchmark
		     * @returns {Object} The benchmark instance.
		     */
		    function abort() {
		      var event,
		          bench = this,
		          resetting = calledBy.reset;

		      if (bench.running) {
		        event = Event('abort');
		        bench.emit(event);
		        if (!event.cancelled || resetting) {
		          // Avoid infinite recursion.
		          calledBy.abort = true;
		          bench.reset();
		          delete calledBy.abort;

		          if (support.timeout) {
		            clearTimeout(bench._timerId);
		            delete bench._timerId;
		          }
		          if (!resetting) {
		            bench.aborted = true;
		            bench.running = false;
		          }
		        }
		      }
		      return bench;
		    }

		    /**
		     * Creates a new benchmark using the same test and options.
		     *
		     * @memberOf Benchmark
		     * @param {Object} options Options object to overwrite cloned options.
		     * @returns {Object} The new benchmark instance.
		     * @example
		     *
		     * var bizarro = bench.clone({
		     *   'name': 'doppelganger'
		     * });
		     */
		    function clone(options) {
		      var bench = this,
		          result = new bench.constructor(_.assign({}, bench, options));

		      // Correct the `options` object.
		      result.options = _.assign({}, cloneDeep(bench.options), cloneDeep(options));

		      // Copy own custom properties.
		      _.forOwn(bench, function(value, key) {
		        if (!_.has(result, key)) {
		          result[key] = cloneDeep(value);
		        }
		      });

		      return result;
		    }

		    /**
		     * Determines if a benchmark is faster than another.
		     *
		     * @memberOf Benchmark
		     * @param {Object} other The benchmark to compare.
		     * @returns {number} Returns `-1` if slower, `1` if faster, and `0` if indeterminate.
		     */
		    function compare(other) {
		      var bench = this;

		      // Exit early if comparing the same benchmark.
		      if (bench == other) {
		        return 0;
		      }
		      var critical,
		          zStat,
		          sample1 = bench.stats.sample,
		          sample2 = other.stats.sample,
		          size1 = sample1.length,
		          size2 = sample2.length,
		          maxSize = max(size1, size2),
		          minSize = min(size1, size2),
		          u1 = getU(sample1, sample2),
		          u2 = getU(sample2, sample1),
		          u = min(u1, u2);

		      function getScore(xA, sampleB) {
		        return _.reduce(sampleB, function(total, xB) {
		          return total + (xB > xA ? 0 : xB < xA ? 1 : 0.5);
		        }, 0);
		      }

		      function getU(sampleA, sampleB) {
		        return _.reduce(sampleA, function(total, xA) {
		          return total + getScore(xA, sampleB);
		        }, 0);
		      }

		      function getZ(u) {
		        return (u - ((size1 * size2) / 2)) / sqrt((size1 * size2 * (size1 + size2 + 1)) / 12);
		      }
		      // Reject the null hypothesis the two samples come from the
		      // same population (i.e. have the same median) if...
		      if (size1 + size2 > 30) {
		        // ...the z-stat is greater than 1.96 or less than -1.96
		        // http://www.statisticslectures.com/topics/mannwhitneyu/
		        zStat = getZ(u);
		        return abs(zStat) > 1.96 ? (u == u1 ? 1 : -1) : 0;
		      }
		      // ...the U value is less than or equal the critical U value.
		      critical = maxSize < 5 || minSize < 3 ? 0 : uTable[maxSize][minSize - 3];
		      return u <= critical ? (u == u1 ? 1 : -1) : 0;
		    }

		    /**
		     * Reset properties and abort if running.
		     *
		     * @memberOf Benchmark
		     * @returns {Object} The benchmark instance.
		     */
		    function reset() {
		      var bench = this;
		      if (bench.running && !calledBy.abort) {
		        // No worries, `reset()` is called within `abort()`.
		        calledBy.reset = true;
		        bench.abort();
		        delete calledBy.reset;
		        return bench;
		      }
		      var event,
		          index = 0,
		          changes = [],
		          queue = [];

		      // A non-recursive solution to check if properties have changed.
		      // For more information see http://www.jslab.dk/articles/non.recursive.preorder.traversal.part4.
		      var data = {
		        'destination': bench,
		        'source': _.assign({}, cloneDeep(bench.constructor.prototype), cloneDeep(bench.options))
		      };

		      do {
		        _.forOwn(data.source, function(value, key) {
		          var changed,
		              destination = data.destination,
		              currValue = destination[key];

		          // Skip pseudo private properties and event listeners.
		          if (/^_|^events$|^on[A-Z]/.test(key)) {
		            return;
		          }
		          if (_.isObjectLike(value)) {
		            if (_.isArray(value)) {
		              // Check if an array value has changed to a non-array value.
		              if (!_.isArray(currValue)) {
		                changed = true;
		                currValue = [];
		              }
		              // Check if an array has changed its length.
		              if (currValue.length != value.length) {
		                changed = true;
		                currValue = currValue.slice(0, value.length);
		                currValue.length = value.length;
		              }
		            }
		            // Check if an object has changed to a non-object value.
		            else if (!_.isObjectLike(currValue)) {
		              changed = true;
		              currValue = {};
		            }
		            // Register a changed object.
		            if (changed) {
		              changes.push({ 'destination': destination, 'key': key, 'value': currValue });
		            }
		            queue.push({ 'destination': currValue, 'source': value });
		          }
		          // Register a changed primitive.
		          else if (!_.eq(currValue, value) && value !== undefined$1) {
		            changes.push({ 'destination': destination, 'key': key, 'value': value });
		          }
		        });
		      }
		      while ((data = queue[index++]));

		      // If changed emit the `reset` event and if it isn't cancelled reset the benchmark.
		      if (changes.length &&
		          (bench.emit(event = Event('reset')), !event.cancelled)) {
		        _.each(changes, function(data) {
		          data.destination[data.key] = data.value;
		        });
		      }
		      return bench;
		    }

		    /**
		     * Displays relevant benchmark information when coerced to a string.
		     *
		     * @name toString
		     * @memberOf Benchmark
		     * @returns {string} A string representation of the benchmark instance.
		     */
		    function toStringBench() {
		      var bench = this,
		          error = bench.error,
		          hz = bench.hz,
		          id = bench.id,
		          stats = bench.stats,
		          size = stats.sample.length,
		          pm = '\xb1',
		          result = bench.name || (_.isNaN(id) ? id : '<Test #' + id + '>');

		      if (error) {
		        var errorStr;
		        if (!_.isObject(error)) {
		          errorStr = String(error);
		        } else if (!_.isError(Error)) {
		          errorStr = join(error);
		        } else {
		          // Error#name and Error#message properties are non-enumerable.
		          errorStr = join(_.assign({ 'name': error.name, 'message': error.message }, error));
		        }
		        result += ': ' + errorStr;
		      }
		      else {
		        result += ' x ' + formatNumber(hz.toFixed(hz < 100 ? 2 : 0)) + ' ops/sec ' + pm +
		          stats.rme.toFixed(2) + '% (' + size + ' run' + (size == 1 ? '' : 's') + ' sampled)';
		      }
		      return result;
		    }

		    /*------------------------------------------------------------------------*/

		    /**
		     * Clocks the time taken to execute a test per cycle (secs).
		     *
		     * @private
		     * @param {Object} bench The benchmark instance.
		     * @returns {number} The time taken.
		     */
		    function clock() {
		      var options = Benchmark.options,
		          templateData = {},
		          timers = [{ 'ns': timer.ns, 'res': max(0.0015, getRes('ms')), 'unit': 'ms' }];

		      // Lazy define for hi-res timers.
		      clock = function(clone) {
		        var deferred;

		        if (clone instanceof Deferred) {
		          deferred = clone;
		          clone = deferred.benchmark;
		        }
		        var bench = clone._original,
		            stringable = isStringable(bench.fn),
		            count = bench.count = clone.count,
		            decompilable = stringable || (support.decompilation && (clone.setup !== _.noop || clone.teardown !== _.noop)),
		            id = bench.id,
		            name = bench.name || (typeof id == 'number' ? '<Test #' + id + '>' : id),
		            result = 0;

		        // Init `minTime` if needed.
		        clone.minTime = bench.minTime || (bench.minTime = bench.options.minTime = options.minTime);

		        // Compile in setup/teardown functions and the test loop.
		        // Create a new compiled test, instead of using the cached `bench.compiled`,
		        // to avoid potential engine optimizations enabled over the life of the test.
		        var funcBody = deferred
		          ? 'var d#=this,${fnArg}=d#,m#=d#.benchmark._original,f#=m#.fn,su#=m#.setup,td#=m#.teardown;' +
		            // When `deferred.cycles` is `0` then...
		            'if(!d#.cycles){' +
		            // set `deferred.fn`,
		            'd#.fn=function(){var ${fnArg}=d#;if(typeof f#=="function"){try{${fn}\n}catch(e#){f#(d#)}}else{${fn}\n}};' +
		            // set `deferred.teardown`,
		            'd#.teardown=function(){d#.cycles=0;if(typeof td#=="function"){try{${teardown}\n}catch(e#){td#()}}else{${teardown}\n}};' +
		            // execute the benchmark's `setup`,
		            'if(typeof su#=="function"){try{${setup}\n}catch(e#){su#()}}else{${setup}\n};' +
		            // start timer,
		            't#.start(d#);' +
		            // and then execute `deferred.fn` and return a dummy object.
		            '}d#.fn();return{uid:"${uid}"}'

		          : 'var r#,s#,m#=this,f#=m#.fn,i#=m#.count,n#=t#.ns;${setup}\n${begin};' +
		            'while(i#--){${fn}\n}${end};${teardown}\nreturn{elapsed:r#,uid:"${uid}"}';

		        var compiled = bench.compiled = clone.compiled = createCompiled(bench, decompilable, deferred, funcBody),
		            isEmpty = !(templateData.fn || stringable);

		        try {
		          if (isEmpty) {
		            // Firefox may remove dead code from `Function#toString` results.
		            // For more information see http://bugzil.la/536085.
		            throw new Error('The test "' + name + '" is empty. This may be the result of dead code removal.');
		          }
		          else if (!deferred) {
		            // Pretest to determine if compiled code exits early, usually by a
		            // rogue `return` statement, by checking for a return object with the uid.
		            bench.count = 1;
		            compiled = decompilable && (compiled.call(bench, context, timer) || {}).uid == templateData.uid && compiled;
		            bench.count = count;
		          }
		        } catch(e) {
		          compiled = null;
		          clone.error = e || new Error(String(e));
		          bench.count = count;
		        }
		        // Fallback when a test exits early or errors during pretest.
		        if (!compiled && !deferred && !isEmpty) {
		          funcBody = (
		            stringable || (decompilable && !clone.error)
		              ? 'function f#(){${fn}\n}var r#,s#,m#=this,i#=m#.count'
		              : 'var r#,s#,m#=this,f#=m#.fn,i#=m#.count'
		            ) +
		            ',n#=t#.ns;${setup}\n${begin};m#.f#=f#;while(i#--){m#.f#()}${end};' +
		            'delete m#.f#;${teardown}\nreturn{elapsed:r#}';

		          compiled = createCompiled(bench, decompilable, deferred, funcBody);

		          try {
		            // Pretest one more time to check for errors.
		            bench.count = 1;
		            compiled.call(bench, context, timer);
		            bench.count = count;
		            delete clone.error;
		          }
		          catch(e) {
		            bench.count = count;
		            if (!clone.error) {
		              clone.error = e || new Error(String(e));
		            }
		          }
		        }
		        // If no errors run the full test loop.
		        if (!clone.error) {
		          compiled = bench.compiled = clone.compiled = createCompiled(bench, decompilable, deferred, funcBody);
		          result = compiled.call(deferred || bench, context, timer).elapsed;
		        }
		        return result;
		      };

		      /*----------------------------------------------------------------------*/

		      /**
		       * Creates a compiled function from the given function `body`.
		       */
		      function createCompiled(bench, decompilable, deferred, body) {
		        var fn = bench.fn,
		            fnArg = deferred ? getFirstArgument(fn) || 'deferred' : '';

		        templateData.uid = uid + uidCounter++;

		        _.assign(templateData, {
		          'setup': decompilable ? getSource(bench.setup) : interpolate('m#.setup()'),
		          'fn': decompilable ? getSource(fn) : interpolate('m#.fn(' + fnArg + ')'),
		          'fnArg': fnArg,
		          'teardown': decompilable ? getSource(bench.teardown) : interpolate('m#.teardown()')
		        });

		        // Use API of chosen timer.
		        if (timer.unit == 'ns') {
		          _.assign(templateData, {
		            'begin': interpolate('s#=n#()'),
		            'end': interpolate('r#=n#(s#);r#=r#[0]+(r#[1]/1e9)')
		          });
		        }
		        else if (timer.unit == 'us') {
		          if (timer.ns.stop) {
		            _.assign(templateData, {
		              'begin': interpolate('s#=n#.start()'),
		              'end': interpolate('r#=n#.microseconds()/1e6')
		            });
		          } else {
		            _.assign(templateData, {
		              'begin': interpolate('s#=n#()'),
		              'end': interpolate('r#=(n#()-s#)/1e6')
		            });
		          }
		        }
		        else if (timer.ns.now) {
		          _.assign(templateData, {
		            'begin': interpolate('s#=n#.now()'),
		            'end': interpolate('r#=(n#.now()-s#)/1e3')
		          });
		        }
		        else {
		          _.assign(templateData, {
		            'begin': interpolate('s#=new n#().getTime()'),
		            'end': interpolate('r#=(new n#().getTime()-s#)/1e3')
		          });
		        }
		        // Define `timer` methods.
		        timer.start = createFunction(
		          interpolate('o#'),
		          interpolate('var n#=this.ns,${begin};o#.elapsed=0;o#.timeStamp=s#')
		        );

		        timer.stop = createFunction(
		          interpolate('o#'),
		          interpolate('var n#=this.ns,s#=o#.timeStamp,${end};o#.elapsed=r#')
		        );

		        // Create compiled test.
		        return createFunction(
		          interpolate('window,t#'),
		          'var global = window, clearTimeout = global.clearTimeout, setTimeout = global.setTimeout;\n' +
		          interpolate(body)
		        );
		      }

		      /**
		       * Gets the current timer's minimum resolution (secs).
		       */
		      function getRes(unit) {
		        var measured,
		            begin,
		            count = 30,
		            divisor = 1e3,
		            ns = timer.ns,
		            sample = [];

		        // Get average smallest measurable time.
		        while (count--) {
		          if (unit == 'us') {
		            divisor = 1e6;
		            if (ns.stop) {
		              ns.start();
		              while (!(measured = ns.microseconds())) {}
		            } else {
		              begin = ns();
		              while (!(measured = ns() - begin)) {}
		            }
		          }
		          else if (unit == 'ns') {
		            divisor = 1e9;
		            begin = (begin = ns())[0] + (begin[1] / divisor);
		            while (!(measured = ((measured = ns())[0] + (measured[1] / divisor)) - begin)) {}
		            divisor = 1;
		          }
		          else if (ns.now) {
		            begin = ns.now();
		            while (!(measured = ns.now() - begin)) {}
		          }
		          else {
		            begin = new ns().getTime();
		            while (!(measured = new ns().getTime() - begin)) {}
		          }
		          // Check for broken timers.
		          if (measured > 0) {
		            sample.push(measured);
		          } else {
		            sample.push(Infinity);
		            break;
		          }
		        }
		        // Convert to seconds.
		        return getMean(sample) / divisor;
		      }

		      /**
		       * Interpolates a given template string.
		       */
		      function interpolate(string) {
		        // Replaces all occurrences of `#` with a unique number and template tokens with content.
		        return _.template(string.replace(/\#/g, /\d+/.exec(templateData.uid)))(templateData);
		      }

		      /*----------------------------------------------------------------------*/

		      // Detect Chrome's microsecond timer:
		      // enable benchmarking via the --enable-benchmarking command
		      // line switch in at least Chrome 7 to use chrome.Interval
		      try {
		        if ((timer.ns = new (context.chrome || context.chromium).Interval)) {
		          timers.push({ 'ns': timer.ns, 'res': getRes('us'), 'unit': 'us' });
		        }
		      } catch(e) {}

		      // Detect Node.js's nanosecond resolution timer available in Node.js >= 0.8.
		      if (processObject && typeof (timer.ns = processObject.hrtime) == 'function') {
		        timers.push({ 'ns': timer.ns, 'res': getRes('ns'), 'unit': 'ns' });
		      }
		      // Detect Wade Simmons' Node.js `microtime` module.
		      if (microtimeObject && typeof (timer.ns = microtimeObject.now) == 'function') {
		        timers.push({ 'ns': timer.ns,  'res': getRes('us'), 'unit': 'us' });
		      }
		      // Pick timer with highest resolution.
		      timer = _.minBy(timers, 'res');

		      // Error if there are no working timers.
		      if (timer.res == Infinity) {
		        throw new Error('Benchmark.js was unable to find a working timer.');
		      }
		      // Resolve time span required to achieve a percent uncertainty of at most 1%.
		      // For more information see http://spiff.rit.edu/classes/phys273/uncert/uncert.html.
		      options.minTime || (options.minTime = max(timer.res / 2 / 0.01, 0.05));
		      return clock.apply(null, arguments);
		    }

		    /*------------------------------------------------------------------------*/

		    /**
		     * Computes stats on benchmark results.
		     *
		     * @private
		     * @param {Object} bench The benchmark instance.
		     * @param {Object} options The options object.
		     */
		    function compute(bench, options) {
		      options || (options = {});

		      var async = options.async,
		          elapsed = 0,
		          initCount = bench.initCount,
		          minSamples = bench.minSamples,
		          queue = [],
		          sample = bench.stats.sample;

		      /**
		       * Adds a clone to the queue.
		       */
		      function enqueue() {
		        queue.push(_.assign(bench.clone(), {
		          '_original': bench,
		          'events': {
		            'abort': [update],
		            'cycle': [update],
		            'error': [update],
		            'start': [update]
		          }
		        }));
		      }

		      /**
		       * Updates the clone/original benchmarks to keep their data in sync.
		       */
		      function update(event) {
		        var clone = this,
		            type = event.type;

		        if (bench.running) {
		          if (type == 'start') {
		            // Note: `clone.minTime` prop is inited in `clock()`.
		            clone.count = bench.initCount;
		          }
		          else {
		            if (type == 'error') {
		              bench.error = clone.error;
		            }
		            if (type == 'abort') {
		              bench.abort();
		              bench.emit('cycle');
		            } else {
		              event.currentTarget = event.target = bench;
		              bench.emit(event);
		            }
		          }
		        } else if (bench.aborted) {
		          // Clear abort listeners to avoid triggering bench's abort/cycle again.
		          clone.events.abort.length = 0;
		          clone.abort();
		        }
		      }

		      /**
		       * Determines if more clones should be queued or if cycling should stop.
		       */
		      function evaluate(event) {
		        var critical,
		            df,
		            mean,
		            moe,
		            rme,
		            sd,
		            sem,
		            variance,
		            clone = event.target,
		            done = bench.aborted,
		            now = _.now(),
		            size = sample.push(clone.times.period),
		            maxedOut = size >= minSamples && (elapsed += now - clone.times.timeStamp) / 1e3 > bench.maxTime,
		            times = bench.times,
		            varOf = function(sum, x) { return sum + pow(x - mean, 2); };

		        // Exit early for aborted or unclockable tests.
		        if (done || clone.hz == Infinity) {
		          maxedOut = !(size = sample.length = queue.length = 0);
		        }

		        if (!done) {
		          // Compute the sample mean (estimate of the population mean).
		          mean = getMean(sample);
		          // Compute the sample variance (estimate of the population variance).
		          variance = _.reduce(sample, varOf, 0) / (size - 1) || 0;
		          // Compute the sample standard deviation (estimate of the population standard deviation).
		          sd = sqrt(variance);
		          // Compute the standard error of the mean (a.k.a. the standard deviation of the sampling distribution of the sample mean).
		          sem = sd / sqrt(size);
		          // Compute the degrees of freedom.
		          df = size - 1;
		          // Compute the critical value.
		          critical = tTable[Math.round(df) || 1] || tTable.infinity;
		          // Compute the margin of error.
		          moe = sem * critical;
		          // Compute the relative margin of error.
		          rme = (moe / mean) * 100 || 0;

		          _.assign(bench.stats, {
		            'deviation': sd,
		            'mean': mean,
		            'moe': moe,
		            'rme': rme,
		            'sem': sem,
		            'variance': variance
		          });

		          // Abort the cycle loop when the minimum sample size has been collected
		          // and the elapsed time exceeds the maximum time allowed per benchmark.
		          // We don't count cycle delays toward the max time because delays may be
		          // increased by browsers that clamp timeouts for inactive tabs. For more
		          // information see https://developer.mozilla.org/en/window.setTimeout#Inactive_tabs.
		          if (maxedOut) {
		            // Reset the `initCount` in case the benchmark is rerun.
		            bench.initCount = initCount;
		            bench.running = false;
		            done = true;
		            times.elapsed = (now - times.timeStamp) / 1e3;
		          }
		          if (bench.hz != Infinity) {
		            bench.hz = 1 / mean;
		            times.cycle = mean * bench.count;
		            times.period = mean;
		          }
		        }
		        // If time permits, increase sample size to reduce the margin of error.
		        if (queue.length < 2 && !maxedOut) {
		          enqueue();
		        }
		        // Abort the `invoke` cycle when done.
		        event.aborted = done;
		      }

		      // Init queue and begin.
		      enqueue();
		      invoke(queue, {
		        'name': 'run',
		        'args': { 'async': async },
		        'queued': true,
		        'onCycle': evaluate,
		        'onComplete': function() { bench.emit('complete'); }
		      });
		    }

		    /*------------------------------------------------------------------------*/

		    /**
		     * Cycles a benchmark until a run `count` can be established.
		     *
		     * @private
		     * @param {Object} clone The cloned benchmark instance.
		     * @param {Object} options The options object.
		     */
		    function cycle(clone, options) {
		      options || (options = {});

		      var deferred;
		      if (clone instanceof Deferred) {
		        deferred = clone;
		        clone = clone.benchmark;
		      }
		      var clocked,
		          cycles,
		          divisor,
		          event,
		          minTime,
		          period,
		          async = options.async,
		          bench = clone._original,
		          count = clone.count,
		          times = clone.times;

		      // Continue, if not aborted between cycles.
		      if (clone.running) {
		        // `minTime` is set to `Benchmark.options.minTime` in `clock()`.
		        cycles = ++clone.cycles;
		        clocked = deferred ? deferred.elapsed : clock(clone);
		        minTime = clone.minTime;

		        if (cycles > bench.cycles) {
		          bench.cycles = cycles;
		        }
		        if (clone.error) {
		          event = Event('error');
		          event.message = clone.error;
		          clone.emit(event);
		          if (!event.cancelled) {
		            clone.abort();
		          }
		        }
		      }
		      // Continue, if not errored.
		      if (clone.running) {
		        // Compute the time taken to complete last test cycle.
		        bench.times.cycle = times.cycle = clocked;
		        // Compute the seconds per operation.
		        period = bench.times.period = times.period = clocked / count;
		        // Compute the ops per second.
		        bench.hz = clone.hz = 1 / period;
		        // Avoid working our way up to this next time.
		        bench.initCount = clone.initCount = count;
		        // Do we need to do another cycle?
		        clone.running = clocked < minTime;

		        if (clone.running) {
		          // Tests may clock at `0` when `initCount` is a small number,
		          // to avoid that we set its count to something a bit higher.
		          if (!clocked && (divisor = divisors[clone.cycles]) != null) {
		            count = floor(4e6 / divisor);
		          }
		          // Calculate how many more iterations it will take to achieve the `minTime`.
		          if (count <= clone.count) {
		            count += Math.ceil((minTime - clocked) / period);
		          }
		          clone.running = count != Infinity;
		        }
		      }
		      // Should we exit early?
		      event = Event('cycle');
		      clone.emit(event);
		      if (event.aborted) {
		        clone.abort();
		      }
		      // Figure out what to do next.
		      if (clone.running) {
		        // Start a new cycle.
		        clone.count = count;
		        if (deferred) {
		          clone.compiled.call(deferred, context, timer);
		        } else if (async) {
		          delay(clone, function() { cycle(clone, options); });
		        } else {
		          cycle(clone);
		        }
		      }
		      else {
		        // Fix TraceMonkey bug associated with clock fallbacks.
		        // For more information see http://bugzil.la/509069.
		        if (support.browser) {
		          runScript(uid + '=1;delete ' + uid);
		        }
		        // We're done.
		        clone.emit('complete');
		      }
		    }

		    /*------------------------------------------------------------------------*/

		    /**
		     * Runs the benchmark.
		     *
		     * @memberOf Benchmark
		     * @param {Object} [options={}] Options object.
		     * @returns {Object} The benchmark instance.
		     * @example
		     *
		     * // basic usage
		     * bench.run();
		     *
		     * // or with options
		     * bench.run({ 'async': true });
		     */
		    function run(options) {
		      var bench = this,
		          event = Event('start');

		      // Set `running` to `false` so `reset()` won't call `abort()`.
		      bench.running = false;
		      bench.reset();
		      bench.running = true;

		      bench.count = bench.initCount;
		      bench.times.timeStamp = _.now();
		      bench.emit(event);

		      if (!event.cancelled) {
		        options = { 'async': ((options = options && options.async) == null ? bench.async : options) && support.timeout };

		        // For clones created within `compute()`.
		        if (bench._original) {
		          if (bench.defer) {
		            Deferred(bench);
		          } else {
		            cycle(bench, options);
		          }
		        }
		        // For original benchmarks.
		        else {
		          compute(bench, options);
		        }
		      }
		      return bench;
		    }

		    /*------------------------------------------------------------------------*/

		    // Firefox 1 erroneously defines variable and argument names of functions on
		    // the function itself as non-configurable properties with `undefined` values.
		    // The bugginess continues as the `Benchmark` constructor has an argument
		    // named `options` and Firefox 1 will not assign a value to `Benchmark.options`,
		    // making it non-writable in the process, unless it is the first property
		    // assigned by for-in loop of `_.assign()`.
		    _.assign(Benchmark, {

		      /**
		       * The default options copied by benchmark instances.
		       *
		       * @static
		       * @memberOf Benchmark
		       * @type Object
		       */
		      'options': {

		        /**
		         * A flag to indicate that benchmark cycles will execute asynchronously
		         * by default.
		         *
		         * @memberOf Benchmark.options
		         * @type boolean
		         */
		        'async': false,

		        /**
		         * A flag to indicate that the benchmark clock is deferred.
		         *
		         * @memberOf Benchmark.options
		         * @type boolean
		         */
		        'defer': false,

		        /**
		         * The delay between test cycles (secs).
		         * @memberOf Benchmark.options
		         * @type number
		         */
		        'delay': 0.005,

		        /**
		         * Displayed by `Benchmark#toString` when a `name` is not available
		         * (auto-generated if absent).
		         *
		         * @memberOf Benchmark.options
		         * @type string
		         */
		        'id': undefined$1,

		        /**
		         * The default number of times to execute a test on a benchmark's first cycle.
		         *
		         * @memberOf Benchmark.options
		         * @type number
		         */
		        'initCount': 1,

		        /**
		         * The maximum time a benchmark is allowed to run before finishing (secs).
		         *
		         * Note: Cycle delays aren't counted toward the maximum time.
		         *
		         * @memberOf Benchmark.options
		         * @type number
		         */
		        'maxTime': 5,

		        /**
		         * The minimum sample size required to perform statistical analysis.
		         *
		         * @memberOf Benchmark.options
		         * @type number
		         */
		        'minSamples': 5,

		        /**
		         * The time needed to reduce the percent uncertainty of measurement to 1% (secs).
		         *
		         * @memberOf Benchmark.options
		         * @type number
		         */
		        'minTime': 0,

		        /**
		         * The name of the benchmark.
		         *
		         * @memberOf Benchmark.options
		         * @type string
		         */
		        'name': undefined$1,

		        /**
		         * An event listener called when the benchmark is aborted.
		         *
		         * @memberOf Benchmark.options
		         * @type Function
		         */
		        'onAbort': undefined$1,

		        /**
		         * An event listener called when the benchmark completes running.
		         *
		         * @memberOf Benchmark.options
		         * @type Function
		         */
		        'onComplete': undefined$1,

		        /**
		         * An event listener called after each run cycle.
		         *
		         * @memberOf Benchmark.options
		         * @type Function
		         */
		        'onCycle': undefined$1,

		        /**
		         * An event listener called when a test errors.
		         *
		         * @memberOf Benchmark.options
		         * @type Function
		         */
		        'onError': undefined$1,

		        /**
		         * An event listener called when the benchmark is reset.
		         *
		         * @memberOf Benchmark.options
		         * @type Function
		         */
		        'onReset': undefined$1,

		        /**
		         * An event listener called when the benchmark starts running.
		         *
		         * @memberOf Benchmark.options
		         * @type Function
		         */
		        'onStart': undefined$1
		      },

		      /**
		       * Platform object with properties describing things like browser name,
		       * version, and operating system. See [`platform.js`](https://mths.be/platform).
		       *
		       * @static
		       * @memberOf Benchmark
		       * @type Object
		       */
		      'platform': context.platform || require('platform') || ({
		        'description': context.navigator && context.navigator.userAgent || null,
		        'layout': null,
		        'product': null,
		        'name': null,
		        'manufacturer': null,
		        'os': null,
		        'prerelease': null,
		        'version': null,
		        'toString': function() {
		          return this.description || '';
		        }
		      }),

		      /**
		       * The semantic version number.
		       *
		       * @static
		       * @memberOf Benchmark
		       * @type string
		       */
		      'version': '2.1.4'
		    });

		    _.assign(Benchmark, {
		      'filter': filter,
		      'formatNumber': formatNumber,
		      'invoke': invoke,
		      'join': join,
		      'runInContext': runInContext,
		      'support': support
		    });

		    // Add lodash methods to Benchmark.
		    _.each(['each', 'forEach', 'forOwn', 'has', 'indexOf', 'map', 'reduce'], function(methodName) {
		      Benchmark[methodName] = _[methodName];
		    });

		    /*------------------------------------------------------------------------*/

		    _.assign(Benchmark.prototype, {

		      /**
		       * The number of times a test was executed.
		       *
		       * @memberOf Benchmark
		       * @type number
		       */
		      'count': 0,

		      /**
		       * The number of cycles performed while benchmarking.
		       *
		       * @memberOf Benchmark
		       * @type number
		       */
		      'cycles': 0,

		      /**
		       * The number of executions per second.
		       *
		       * @memberOf Benchmark
		       * @type number
		       */
		      'hz': 0,

		      /**
		       * The compiled test function.
		       *
		       * @memberOf Benchmark
		       * @type {Function|string}
		       */
		      'compiled': undefined$1,

		      /**
		       * The error object if the test failed.
		       *
		       * @memberOf Benchmark
		       * @type Object
		       */
		      'error': undefined$1,

		      /**
		       * The test to benchmark.
		       *
		       * @memberOf Benchmark
		       * @type {Function|string}
		       */
		      'fn': undefined$1,

		      /**
		       * A flag to indicate if the benchmark is aborted.
		       *
		       * @memberOf Benchmark
		       * @type boolean
		       */
		      'aborted': false,

		      /**
		       * A flag to indicate if the benchmark is running.
		       *
		       * @memberOf Benchmark
		       * @type boolean
		       */
		      'running': false,

		      /**
		       * Compiled into the test and executed immediately **before** the test loop.
		       *
		       * @memberOf Benchmark
		       * @type {Function|string}
		       * @example
		       *
		       * // basic usage
		       * var bench = Benchmark({
		       *   'setup': function() {
		       *     var c = this.count,
		       *         element = document.getElementById('container');
		       *     while (c--) {
		       *       element.appendChild(document.createElement('div'));
		       *     }
		       *   },
		       *   'fn': function() {
		       *     element.removeChild(element.lastChild);
		       *   }
		       * });
		       *
		       * // compiles to something like:
		       * var c = this.count,
		       *     element = document.getElementById('container');
		       * while (c--) {
		       *   element.appendChild(document.createElement('div'));
		       * }
		       * var start = new Date;
		       * while (count--) {
		       *   element.removeChild(element.lastChild);
		       * }
		       * var end = new Date - start;
		       *
		       * // or using strings
		       * var bench = Benchmark({
		       *   'setup': '\
		       *     var a = 0;\n\
		       *     (function() {\n\
		       *       (function() {\n\
		       *         (function() {',
		       *   'fn': 'a += 1;',
		       *   'teardown': '\
		       *          }())\n\
		       *        }())\n\
		       *      }())'
		       * });
		       *
		       * // compiles to something like:
		       * var a = 0;
		       * (function() {
		       *   (function() {
		       *     (function() {
		       *       var start = new Date;
		       *       while (count--) {
		       *         a += 1;
		       *       }
		       *       var end = new Date - start;
		       *     }())
		       *   }())
		       * }())
		       */
		      'setup': _.noop,

		      /**
		       * Compiled into the test and executed immediately **after** the test loop.
		       *
		       * @memberOf Benchmark
		       * @type {Function|string}
		       */
		      'teardown': _.noop,

		      /**
		       * An object of stats including mean, margin or error, and standard deviation.
		       *
		       * @memberOf Benchmark
		       * @type Object
		       */
		      'stats': {

		        /**
		         * The margin of error.
		         *
		         * @memberOf Benchmark#stats
		         * @type number
		         */
		        'moe': 0,

		        /**
		         * The relative margin of error (expressed as a percentage of the mean).
		         *
		         * @memberOf Benchmark#stats
		         * @type number
		         */
		        'rme': 0,

		        /**
		         * The standard error of the mean.
		         *
		         * @memberOf Benchmark#stats
		         * @type number
		         */
		        'sem': 0,

		        /**
		         * The sample standard deviation.
		         *
		         * @memberOf Benchmark#stats
		         * @type number
		         */
		        'deviation': 0,

		        /**
		         * The sample arithmetic mean (secs).
		         *
		         * @memberOf Benchmark#stats
		         * @type number
		         */
		        'mean': 0,

		        /**
		         * The array of sampled periods.
		         *
		         * @memberOf Benchmark#stats
		         * @type Array
		         */
		        'sample': [],

		        /**
		         * The sample variance.
		         *
		         * @memberOf Benchmark#stats
		         * @type number
		         */
		        'variance': 0
		      },

		      /**
		       * An object of timing data including cycle, elapsed, period, start, and stop.
		       *
		       * @memberOf Benchmark
		       * @type Object
		       */
		      'times': {

		        /**
		         * The time taken to complete the last cycle (secs).
		         *
		         * @memberOf Benchmark#times
		         * @type number
		         */
		        'cycle': 0,

		        /**
		         * The time taken to complete the benchmark (secs).
		         *
		         * @memberOf Benchmark#times
		         * @type number
		         */
		        'elapsed': 0,

		        /**
		         * The time taken to execute the test once (secs).
		         *
		         * @memberOf Benchmark#times
		         * @type number
		         */
		        'period': 0,

		        /**
		         * A timestamp of when the benchmark started (ms).
		         *
		         * @memberOf Benchmark#times
		         * @type number
		         */
		        'timeStamp': 0
		      }
		    });

		    _.assign(Benchmark.prototype, {
		      'abort': abort,
		      'clone': clone,
		      'compare': compare,
		      'emit': emit,
		      'listeners': listeners,
		      'off': off,
		      'on': on,
		      'reset': reset,
		      'run': run,
		      'toString': toStringBench
		    });

		    /*------------------------------------------------------------------------*/

		    _.assign(Deferred.prototype, {

		      /**
		       * The deferred benchmark instance.
		       *
		       * @memberOf Benchmark.Deferred
		       * @type Object
		       */
		      'benchmark': null,

		      /**
		       * The number of deferred cycles performed while benchmarking.
		       *
		       * @memberOf Benchmark.Deferred
		       * @type number
		       */
		      'cycles': 0,

		      /**
		       * The time taken to complete the deferred benchmark (secs).
		       *
		       * @memberOf Benchmark.Deferred
		       * @type number
		       */
		      'elapsed': 0,

		      /**
		       * A timestamp of when the deferred benchmark started (ms).
		       *
		       * @memberOf Benchmark.Deferred
		       * @type number
		       */
		      'timeStamp': 0
		    });

		    _.assign(Deferred.prototype, {
		      'resolve': resolve
		    });

		    /*------------------------------------------------------------------------*/

		    _.assign(Event.prototype, {

		      /**
		       * A flag to indicate if the emitters listener iteration is aborted.
		       *
		       * @memberOf Benchmark.Event
		       * @type boolean
		       */
		      'aborted': false,

		      /**
		       * A flag to indicate if the default action is cancelled.
		       *
		       * @memberOf Benchmark.Event
		       * @type boolean
		       */
		      'cancelled': false,

		      /**
		       * The object whose listeners are currently being processed.
		       *
		       * @memberOf Benchmark.Event
		       * @type Object
		       */
		      'currentTarget': undefined$1,

		      /**
		       * The return value of the last executed listener.
		       *
		       * @memberOf Benchmark.Event
		       * @type Mixed
		       */
		      'result': undefined$1,

		      /**
		       * The object to which the event was originally emitted.
		       *
		       * @memberOf Benchmark.Event
		       * @type Object
		       */
		      'target': undefined$1,

		      /**
		       * A timestamp of when the event was created (ms).
		       *
		       * @memberOf Benchmark.Event
		       * @type number
		       */
		      'timeStamp': 0,

		      /**
		       * The event type.
		       *
		       * @memberOf Benchmark.Event
		       * @type string
		       */
		      'type': ''
		    });

		    /*------------------------------------------------------------------------*/

		    /**
		     * The default options copied by suite instances.
		     *
		     * @static
		     * @memberOf Benchmark.Suite
		     * @type Object
		     */
		    Suite.options = {

		      /**
		       * The name of the suite.
		       *
		       * @memberOf Benchmark.Suite.options
		       * @type string
		       */
		      'name': undefined$1
		    };

		    /*------------------------------------------------------------------------*/

		    _.assign(Suite.prototype, {

		      /**
		       * The number of benchmarks in the suite.
		       *
		       * @memberOf Benchmark.Suite
		       * @type number
		       */
		      'length': 0,

		      /**
		       * A flag to indicate if the suite is aborted.
		       *
		       * @memberOf Benchmark.Suite
		       * @type boolean
		       */
		      'aborted': false,

		      /**
		       * A flag to indicate if the suite is running.
		       *
		       * @memberOf Benchmark.Suite
		       * @type boolean
		       */
		      'running': false
		    });

		    _.assign(Suite.prototype, {
		      'abort': abortSuite,
		      'add': add,
		      'clone': cloneSuite,
		      'emit': emit,
		      'filter': filterSuite,
		      'join': arrayRef.join,
		      'listeners': listeners,
		      'off': off,
		      'on': on,
		      'pop': arrayRef.pop,
		      'push': push,
		      'reset': resetSuite,
		      'run': runSuite,
		      'reverse': arrayRef.reverse,
		      'shift': shift,
		      'slice': slice,
		      'sort': arrayRef.sort,
		      'splice': arrayRef.splice,
		      'unshift': unshift
		    });

		    /*------------------------------------------------------------------------*/

		    // Expose Deferred, Event, and Suite.
		    _.assign(Benchmark, {
		      'Deferred': Deferred,
		      'Event': Event,
		      'Suite': Suite
		    });

		    /*------------------------------------------------------------------------*/

		    // Add lodash methods as Suite methods.
		    _.each(['each', 'forEach', 'indexOf', 'map', 'reduce'], function(methodName) {
		      var func = _[methodName];
		      Suite.prototype[methodName] = function() {
		        var args = [this];
		        push.apply(args, arguments);
		        return func.apply(_, args);
		      };
		    });

		    // Avoid array-like object bugs with `Array#shift` and `Array#splice`
		    // in Firefox < 10 and IE < 9.
		    _.each(['pop', 'shift', 'splice'], function(methodName) {
		      var func = arrayRef[methodName];

		      Suite.prototype[methodName] = function() {
		        var value = this,
		            result = func.apply(value, arguments);

		        if (value.length === 0) {
		          delete value[0];
		        }
		        return result;
		      };
		    });

		    // Avoid buggy `Array#unshift` in IE < 8 which doesn't return the new
		    // length of the array.
		    Suite.prototype.unshift = function() {
		      var value = this;
		      unshift.apply(value, arguments);
		      return value.length;
		    };

		    return Benchmark;
		  }

		  /*--------------------------------------------------------------------------*/

		  // Export Benchmark.
		  // Some AMD build optimizers, like r.js, check for condition patterns like the following:
		  {
		    var Benchmark = runInContext();

		    // Check for `exports` after `define` in case a build optimizer adds an `exports` object.
		    if (freeExports && freeModule) {
		      // Export for Node.js.
		      if (moduleExports) {
		        (freeModule.exports = Benchmark).Benchmark = Benchmark;
		      }
		      // Export for CommonJS support.
		      freeExports.Benchmark = Benchmark;
		    }
		    else {
		      // Export to the global object.
		      root.Benchmark = Benchmark;
		    }
		  }
		}.call(benchmark)); 
	} (benchmark$1, benchmark$1.exports));
	return benchmark$1.exports;
}

requireBenchmark();

// NOTE: USED FOR SIGNING AND VERIFICATION KEEPS DATA IN A STRICT ORDER
async function encodeStrict(data) {
	if (noValue(data)) {
		return;
	}
	try {
		return encode$2(data, rfc8949EncodeOptions);
	} catch (error) {
		// console.error(error);
		return;
	}
}
async function jsDecode(data) {
	if (noValue(data)) {
		return;
	}
	try {
		return decode$1(data);
	} catch (error) {
		// console.error(error);
		return;
	}
}

function encode$1(source) {
	return encodeStrict(source);
}
function getSeedSize(schemeID) {
	return SEED_SIZES[schemeID] || 32;
}
async function kmac(key, message, dkLen = 32, personalization) {
	return kmac256xof(key, message, {
		personalization,
		dkLen,
	});
}
async function hash(message, dkLen = 32) {
	return shake256(message, {
		dkLen,
	});
}
async function hashInstance(size = 32) {
	return shake256.create({
		dkLen: size,
	});
}
async function normalize(source, size = 256) {
	return hash((isPlainObject(source)) ? await encode$1(source) : source, size);
}

/*
	NOTE: The size of the key and nonce for the KMAC is 64 bytes MIN by default for PQ Era.
*/
async function createKey(source, size = SECRET_KEY_SIZES.key_64_bytes) {
	const result = await normalize(source, size);
	console.log('Key Created', result);
	return result;
}
async function createNonce(source, size = SECRET_KEY_SIZES.key_64_bytes) {
	const result = await normalize(source, size);
	console.log('Nonce Created', result);
	return result;
}
async function createSalt(source, size = SECRET_KEY_SIZES.key_64_bytes) {
	const result = await normalize(source, size);
	console.log('Salt Created', result);
	return result;
}
// await example();

async function logInfo() {
	console.log('logInfo START __________________');
	const exported = await this.exportObject();
	exported.forEach((value, key) => {
		if (isBuffer$1(value) || isU8(value)) {
			console.log(`${key}: <Buffer:${value.length} bytes>`);
		} else {
			console.log(`${key}: ${value}`);
		}
	});
	console.log('Binary export size', (await this.exportBinary()).length);
	console.log('logInfo END __________________');
}
/**
	* Converts integer property values on a seed or key object to their text representation.
	* @param {Object} source - The plain object (seed or key) to describe.
	* @param {boolean} [logOutput=true] - Whether to log the output to console.
	* @returns {Object} An object with the same keys but with text values where applicable.
 */
function describeObject(source, logOutput = true) {
	if (!isPlainObject(source)) {
		console.error('describeObject requires a plain object');
		return null;
	}
	const described = {};
	// console.log(source);
	for (const [
		key,
		value,
	] of Object.entries(source)) {
		const lookup = PROPERTY_LOOKUP[key];
		if (lookup && hasValue(value)) {
			// console.log(lookup, value);
			described[key] = lookup.get(value) ?? `UNKNOWN(${value})`;
		} else if (isBuffer$1(value) || isU8(value)) {
			described[key] = `<Buffer:${value.length} bytes>`;
		} else if (isPlainObject(value)) {
			described[key] = describeObject(value, false);
		} else {
			described[key] = value;
		}
	}
	if (logOutput) {
		console.log('__________OBJECT STRUCT START__________');
		console.log('==> TYPE:', (source.key) ? 'KEY' : 'SEED', '<==');
		for (const [
			key,
			value,
		] of Object.entries(described)) {
			if (isPlainObject(value)) {
				console.log(`  ${key}:`, value);
			} else {
				console.log(`  ${key}: ${value}`);
			}
		}
		console.log('__________OBJECT STRUCT END__________');
	}
	return described;
}
/**
 * Static method to get the text name for a specific property type and value.
 * @param {string} propertyName - The property name (e.g., 'scheme', 'kind', 'network').
 * @param {number} value - The integer value to look up.
 * @returns {string|null} The text representation or null if not found.
 */
function getPropertyName(propertyName, value) {
	const lookup = PROPERTY_LOOKUP[propertyName];
	if (!lookup) {
		return null;
	}
	return lookup[value] ?? null;
}
async function validateSeedObject(source, errors = []) {
	const requiredProperties = ['seed'];
	requiredProperties.forEach((item) => {
		if (noValue(source[item])) {
			errors.push(`Missing required property: ${item}`);
		}
	});
	await this.validateObject(source, errors);
	return (errors.length && errors) || true;
}
var info = {
	logInfo,
	describeObject,
	getPropertyName,
	validateSeedObject,
};

// Surface that should NOT be enumerated on the browser's `navigator`:
//  * Protected Audience API (`runAdAuction`, `joinAdInterestGroup`, etc.) —
//    deprecated, accessing the function references logs warnings.
//  * Legacy quota storage (`webkitPersistentStorage`, `webkitTemporaryStorage`) —
//    reading either property triggers Chrome's
//    "StorageType.persistent is deprecated" console warning even if we
//    never invoke a method on the returned handle. The modern
//    `navigator.storage` API replaces both.
//  * Permission-gated APIs that yield nothing without a user grant
//    (bluetooth/usb/serial/hid/geolocation/wakeLock/presentation/xr/clipboard).
//  * Live device handles that aren't deterministic fingerprint material
//    (mediaDevices/serviceWorker/credentials/locks).
//  * Legacy aliases with deprecation warnings (`webkitGetUserMedia`).
const BROWSER_IGNORED = new Set([
	'plugins',
	'mimeTypes',
	'clipboard',
	'credentials',
	'locks',
	'mediaDevices',
	'serviceWorker',
	'runAdAuction',
	'joinAdInterestGroup',
	'leaveAdInterestGroup',
	'updateAdInterestGroups',
	'clearOriginJoinedAdInterestGroups',
	'getInterestGroupAdAuctionData',
	'createAuctionNonce',
	'protectedAudience',
	'adAuctionComponents',
	'deprecatedURNToURL',
	'deprecatedReplaceInURN',
	'webkitPersistentStorage',
	'webkitTemporaryStorage',
	'storage',
	'bluetooth',
	'usb',
	'serial',
	'hid',
	'wakeLock',
	'presentation',
	'xr',
	'geolocation',
	'permissions',
	'share',
	'canShare',
	'vibrate',
	'mediaCapabilities',
	'windowControlsOverlay',
	'virtualKeyboard',
	'ink',
	'webkitGetUserMedia',
	'getUserMedia',
	'getGamepads',
	'getInstalledRelatedApps',
	'requestMIDIAccess',
]);
function getFingerprintPropertyNames(source) {
	if (!source) {
		return [];
	}
	const names = [];
	let current = source;
	while (current && current !== Object.prototype) {
		for (const propertyName of Object.getOwnPropertyNames(current)) {
			if (propertyName === 'constructor' || propertyName === '__proto__') {
				continue;
			}
			if (!names.includes(propertyName)) {
				names.push(propertyName);
			}
		}
		current = Object.getPrototypeOf(current);
	}
	return names.sort();
}
function normalizeFingerprintValue(value) {
	if (value === null || isUndefined(value)) {
		return undefined;
	}
	if (isFunction(value) || typeof value === 'symbol') {
		return undefined;
	}
	if (isString(value)) {
		const trimmed = value.trim();
		return trimmed ? trimmed : undefined;
	}
	if (isNumber(value)) {
		return Number.isFinite(value) ? value : undefined;
	}
	if (isBoolean(value) || isBigInt(value)) {
		return value;
	}
	if (isBuffer$1(value) || isU8(value) || isTypedArray(value)) {
		return value.length ? Array.from(value, (item) => {
			return item.toString(16).padStart(2, '0');
		}).join('') : undefined;
	}
	if (Array.isArray(value)) {
		const normalized = value
			.map(normalizeFingerprintValue)
			.filter((item) => {
				return item !== undefined;
			});
		return normalized.length ? normalized : undefined;
	}
	if (isPlainObject(value)) {
		const normalized = {};
		for (const entry of Object.entries(value)) {
			const key = entry[0];
			const item = entry[1];
			const normalizedItem = normalizeFingerprintValue(item);
			if (normalizedItem !== undefined) {
				normalized[key] = normalizedItem;
			}
		}
		return Object.keys(normalized).length ? normalized : undefined;
	}
	return undefined;
}
function collectFingerprintProperties(source, ignored = new Set()) {
	const fingerprint = {};
	for (const key of getFingerprintPropertyNames(source)) {
		if (ignored.has(key)) {
			continue;
		}
		try {
			const normalizedValue = normalizeFingerprintValue(source[key]);
			if (normalizedValue !== undefined) {
				fingerprint[key] = normalizedValue;
			}
		} catch (error) {
			continue;
		}
	}
	return fingerprint;
}
function collectCanvasFingerprint() {
	try {
		const canvas = globalThis.document.createElement('canvas');
		const context = canvas.getContext('2d');
		if (!context) {
			return undefined;
		}
		context.textBaseline = 'top';
		context.font = '14px "Arial"';
		context.fillStyle = 'rgba(108, 74, 255, 0.74)';
		context.fillText('🔒 UW HDST', 2, 2);
		context.strokeStyle = '#34d399';
		context.strokeRect(60, 6, 24, 14);
		return canvas.toDataURL();
	} catch (error) {
		return undefined;
	}
}
function collectWebGLFingerprint() {
	try {
		const canvas = globalThis.document.createElement('canvas');
		const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		if (!gl) {
			return undefined;
		}
		const result = {
			vendor: gl.getParameter(gl.VENDOR),
			renderer: gl.getParameter(gl.RENDERER),
			version: gl.getParameter(gl.VERSION),
			shading: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
			maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
			maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
			maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
		};
		const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
		if (debugInfo) {
			result.unmaskedVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
			result.unmaskedRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
		}
		const extensions = gl.getSupportedExtensions();
		if (Array.isArray(extensions) && extensions.length) {
			result.extensions = extensions.slice().sort();
		}
		return normalizeFingerprintValue(result);
	} catch (error) {
		return undefined;
	}
}
async function collectClientHints(navigatorRef) {
	const userAgentData = navigatorRef?.userAgentData;
	if (!userAgentData) {
		return undefined;
	}
	const base = {
		mobile: userAgentData.mobile,
		platform: userAgentData.platform,
	};
	const brands = userAgentData.brands;
	if (Array.isArray(brands) && brands.length) {
		base.brands = brands
			.map((brand) => {
				return `${brand.brand}|${brand.version}`;
			})
			.sort();
	}
	if (typeof userAgentData.getHighEntropyValues === 'function') {
		try {
			const extra = await userAgentData.getHighEntropyValues([
				'architecture',
				'bitness',
				'model',
				'platformVersion',
				'uaFullVersion',
				'fullVersionList',
				'wow64',
			]);
			Object.assign(base, extra);
		} catch (error) {
			// Some browsers gate high-entropy hints; degrade silently.
		}
	}
	return normalizeFingerprintValue(base);
}
function collectViewportFingerprint() {
	const result = {
		innerWidth: globalThis.innerWidth,
		innerHeight: globalThis.innerHeight,
		outerWidth: globalThis.outerWidth,
		outerHeight: globalThis.outerHeight,
		scrollX: globalThis.scrollX,
		scrollY: globalThis.scrollY,
	};
	const visual = globalThis.visualViewport;
	if (visual) {
		result.visualWidth = visual.width;
		result.visualHeight = visual.height;
		result.visualScale = visual.scale;
	}
	return normalizeFingerprintValue(result);
}
function collectIntlFingerprint() {
	const result = {};
	try {
		const dt = new globalThis.Intl.DateTimeFormat().resolvedOptions();
		result.dateTime = {
			locale: dt.locale,
			calendar: dt.calendar,
			numberingSystem: dt.numberingSystem,
			timeZone: dt.timeZone,
		};
	} catch (error) {
		// ignored
	}
	try {
		const nf = new globalThis.Intl.NumberFormat().resolvedOptions();
		result.numberFormat = {
			locale: nf.locale,
			numberingSystem: nf.numberingSystem,
		};
	} catch (error) {
		// ignored
	}
	try {
		const collator = new globalThis.Intl.Collator().resolvedOptions();
		result.collator = {
			locale: collator.locale,
			usage: collator.usage,
			sensitivity: collator.sensitivity,
		};
	} catch (error) {
		// ignored
	}
	return normalizeFingerprintValue(result);
}
function collectCryptoEntropy() {
	const cryptoApi = globalThis.crypto;
	if (!cryptoApi?.getRandomValues) {
		return undefined;
	}
	try {
		const bytes = new Uint8Array(64);
		cryptoApi.getRandomValues(bytes);
		return normalizeFingerprintValue(bytes);
	} catch (error) {
		return undefined;
	}
}
function collectFreshUUIDs() {
	const cryptoApi = globalThis.crypto;
	if (typeof cryptoApi?.randomUUID !== 'function') {
		return undefined;
	}
	const ids = [];
	for (let index = 0; index < 4; index += 1) {
		try {
			ids.push(cryptoApi.randomUUID());
		} catch (error) {
			break;
		}
	}
	return ids.length ? ids : undefined;
}
function collectHardwareSignals(navigatorRef) {
	const result = {
		hardwareConcurrency: navigatorRef.hardwareConcurrency,
		deviceMemory: navigatorRef.deviceMemory,
		maxTouchPoints: navigatorRef.maxTouchPoints,
		pdfViewerEnabled: navigatorRef.pdfViewerEnabled,
		cookieEnabled: navigatorRef.cookieEnabled,
		onLine: navigatorRef.onLine,
	};
	if (navigatorRef.connection) {
		const conn = navigatorRef.connection;
		result.connection = {
			effectiveType: conn.effectiveType,
			downlink: conn.downlink,
			rtt: conn.rtt,
			saveData: conn.saveData,
			type: conn.type,
		};
	}
	return normalizeFingerprintValue(result);
}
async function getFingerprintEntropy(size = 64) {
	const fingerprintData = {
		runtime: 'unknown',
		timezone: new globalThis.Intl.DateTimeFormat().resolvedOptions().timeZone,
		timezoneOffset: new Date().getTimezoneOffset(),
		timeNow: Date.now(),
		perf: globalThis.performance?.now?.(),
		perfTimeOrigin: globalThis.performance?.timeOrigin,
		intl: collectIntlFingerprint(),
		crypto: collectCryptoEntropy(),
		uuids: collectFreshUUIDs(),
	};
	const navigatorRef = globalThis.navigator;
	if (typeof globalThis.document !== 'undefined' && navigatorRef) {
		const screenIgnored = new Set();
		fingerprintData.runtime = 'browser';
		fingerprintData.navigator = collectFingerprintProperties(navigatorRef, BROWSER_IGNORED);
		fingerprintData.hardware = collectHardwareSignals(navigatorRef);
		fingerprintData.clientHints = await collectClientHints(navigatorRef);
		fingerprintData.screen = collectFingerprintProperties(globalThis.screen, screenIgnored);
		fingerprintData.viewport = collectViewportFingerprint();
		fingerprintData.location = collectFingerprintProperties(globalThis.location, new Set(['ancestorOrigins']));
		fingerprintData.devicePixelRatio = normalizeFingerprintValue(globalThis.devicePixelRatio);
		fingerprintData.canvas = normalizeFingerprintValue(collectCanvasFingerprint());
		fingerprintData.webgl = collectWebGLFingerprint();
	}
	if (typeof process !== 'undefined') {
		fingerprintData.process = collectFingerprintProperties(process, new Set([
			'env',
			'argv',
			'argv0',
			'config',
			'features',
			'permission',
			'report',
			'stdin',
			'stdout',
			'stderr',
		]));
		fingerprintData.processVersions = normalizeFingerprintValue(process.versions);
		fingerprintData.processRelease = normalizeFingerprintValue(process.release);
		if (fingerprintData.runtime === 'unknown') {
			fingerprintData.runtime = 'node';
		}
	}
	if (typeof Bun !== 'undefined') {
		fingerprintData.bun = collectFingerprintProperties(Bun, new Set([
			'file',
			'password',
			'stdin',
			'stdout',
			'stderr',
			'unsafe',
		]));
		fingerprintData.runtime = 'bun';
	}
	const encodedFingerprint = await encode$1(fingerprintData);
	return hash(encodedFingerprint, size);
}

/*
	! THIS IS CLOSED SOURCE NOT FOR USE IN OTHER COMMERCIAL APPS PRODUCTS OR SERVICES WHICH COMPETE WITH VIAT OR THE UW
	NOTE: This is overly engineered for the unknown potential of future Quantum Computers.
	NOTE: In the future more entropy sources need to be added to ensure a high entropy for larger 128+ byte pools.
	© copyright Thomas Marchi 2025
*/
const KECCAK_PRG_CAPACITY = 510;
async function spongeEntropy(size = MASTER_ENTROPY_POOL_SIZES$1.MAX, capacity = KECCAK_PRG_CAPACITY) {
	const spongeRandom = keccakprg(capacity);
	spongeRandom.update(randomBytes$1(size));
	return spongeRandom.randomBytes(size);
}
async function generateEntropy(outputSize = MASTER_ENTROPY_POOL_SIZES$1.DEFAULT, sourceSize = 256, sources) {
	const randomSeed = randomBytes$1(sourceSize);
	const kemA = await ml_kem1024.keygen();
	const kemB = await ml_kem1024.keygen();
	const { sharedSecret: secretA } = await ml_kem1024.encapsulate(kemA.publicKey);
	const { sharedSecret: secretB } = await ml_kem1024.encapsulate(kemB.publicKey);
	const fingerprintEntropy = await getFingerprintEntropy(MASTER_ENTROPY_POOL_SIZES$1.DEFAULT);
	const spongeRandom = await spongeEntropy(sourceSize);
	const instance = await hashInstance(sourceSize);
	instance.update(randomSeed)
		.update(secretA)
		.update(secretB)
		.update(spongeRandom)
		.update(fingerprintEntropy);
	const entropyPool = await instance.digest();
	return hash(entropyPool, outputSize);
}
// example();

async function generateEntropyPool(overwriteSize) {
	const stateSeedSize = await this.get('seed_size');
	const size = overwriteSize || stateSeedSize || 128;
	const entropy = await generateEntropy(size);
	return entropy;
}
async function generateMasterNonce(overwriteSize) {
	await this.set('master_nonce', await this.generateEntropyPool(overwriteSize));
	return this;
}
async function generateMasterKey(overwriteSize) {
	await this.set('master_key', await this.generateEntropyPool(overwriteSize));
	return this;
}
async function generateMasterSeed(overwriteSize) {
	await this.set('master_seed', await this.generateEntropyPool(overwriteSize));
	return this;
}
async function generateMasterSalt(overwriteSize) {
	await this.set('master_salt', await this.generateEntropyPool(overwriteSize));
	return this;
}
async function createMasterSeeds() {
	await this.generateMasterKey();
	await this.generateMasterNonce();
	await this.generateMasterSeed();
	await this.generateMasterSalt();
	return this;
}
var masterMethods = {
	generateMasterSalt,
	generateMasterKey,
	generateMasterNonce,
	generateMasterSeed,
	generateEntropyPool,
	createMasterSeeds,
};

async function getState(key) {
	if (!key) {
		return this.getAll();
	}
	if (isUndefined(key)) {
		return this.getAll();
	}
	if (isString(key)) {
		return this.STATE.get(key);
	}
	if (isArray(key)) {
		const result = {};
		eachArray(key, (value) => {
			result[value] = this.STATE.get(value);
		});
		return result;
	}
	if (isPlainObject(key)) {
		eachObject(key, (value, stateKey) => {
			key[stateKey] = this.STATE.get(stateKey);
		});
		return key;
	}
}
async function setState(key, value) {
	if (!key) {
		console.warn('No key provided to setState');
		return this;
	}
	if (value) {
		this.STATE.set(key, value);
		return this;
	}
	if (isMap(key)) {
		for (const [
			subKey,
			subValue,
		] of key) {
			this.STATE.set(subKey, subValue);
		}
		return this;
	}
	if (isPlainObject(key) && !value) {
		eachObject(key, (subValue, subKey) => {
			if (this.STATE.has(subKey) && hasValue(subValue)) {
				this.STATE.set(subKey, subValue);
			}
		});
	}
	return this;
}
async function pluck(key, target = {}) {
	if (isPlainObject(key)) {
		for (const stateKey of Object.keys(key)) {
			target[stateKey] = await this.get(stateKey);
		}
	}
	if (isString(key)) {
		target[key] = await this.get(key);
	}
	return target;
}
async function getAll() {
	this.STATE.entries();
	const objectMap = {};
	this.STATE.forEach((value, key) => {
		objectMap[key] = value;
	});
	return objectMap;
}
async function zeroBuffers() {
	const {
		master_seed, master_key, master_nonce,
	} = await this.getAll();
	if (master_seed) {
		master_seed.fill(0);
	}
	if (master_key) {
		master_key.fill(0);
	}
	if (master_nonce) {
		master_nonce.fill(0);
	}
	return this;
}
async function exportObject() {
	return this.getAll();
}
async function importObject(source) {
	await this.set(source);
	return this;
}
var stateMethods = {
	get: getState,
	set: setState,
	pluck,
	getAll,
	zeroBuffers,
	exportObject,
	importObject,
};

async function setStructDefaults(source) {
	const {
		hash_algorithm,
		keyed_hash_algorithm,
		version,
		network_name,
		wallet_beta,
		wallet_site_beta,
	} = await this.get();
	source.hash_algorithm = hash_algorithm;
	source.keyed_hash_algorithm = keyed_hash_algorithm;
	source.version = version;
	if (network_name) {
		source.network_name = network_name;
	}
	if (wallet_beta) {
		source.wallet_beta = wallet_beta;
	}
	if (wallet_site_beta) {
		source.wallet_site_beta = wallet_site_beta;
	}
	// console.log(source, await this.get());
}
async function generatePreSeedStruct(source = {}) {
	await this.setStructDefaults(source);
	source.object_type = OBJECT_TYPE.PRE_SEED;
	source.seed = await this.get('master_seed');
	await this.describeObject(source);
	return source;
}
async function generateSeedStruct(source = {}) {
	await this.setStructDefaults(source);
	source.object_type = OBJECT_TYPE.SEED;
	await this.describeObject(source);
	return source;
}
async function generatePreKeyStruct(source = {}) {
	await this.setStructDefaults(source);
	source.object_type = OBJECT_TYPE.PRE_KEY;
	source.key = await this.get('master_key');
	await this.describeObject(source);
	return source;
}
async function generateKeyStruct(source = {}, pre_key) {
	await this.setStructDefaults(source);
	source.object_type = OBJECT_TYPE.KEY;
	await this.describeObject(source);
	return source;
}
async function generatePreNonceStruct(source = {}) {
	await this.setStructDefaults(source);
	source.object_type = OBJECT_TYPE.PRE_NONCE;
	source.nonce = await this.get('master_nonce');
	await this.describeObject(source);
	return source;
}
async function generateNonceStruct(source = {}, pre_nonce) {
	await this.setStructDefaults(source);
	source.object_type = OBJECT_TYPE.NONCE;
	if (pre_nonce) {
		source.pre_nonce = pre_nonce;
	}
	await this.describeObject(source);
	return source;
}
async function generatePreSaltStruct(source = {}) {
	await this.setStructDefaults(source);
	source.object_type = OBJECT_TYPE.PRE_SALT;
	source.salt = await this.get('master_salt');
	await this.describeObject(source);
	return source;
}
async function generateSaltStruct(source = {}, pre_salt) {
	await this.setStructDefaults(source);
	source.object_type = OBJECT_TYPE.SALT;
	if (pre_salt) {
		source.pre_salt = pre_salt;
	}
	await this.describeObject(source);
	return source;
}
var structMethods = {
	generateSeedStruct,
	setStructDefaults,
	generatePreSeedStruct,
	generateKeyStruct,
	generatePreKeyStruct,
	generateNonceStruct,
	generatePreNonceStruct,
	generatePreSaltStruct,
	generateSaltStruct,
};

/*
	! THIS IS CLOSED SOURCE NOT FOR USE IN OTHER COMMERCIAL APPS PRODUCTS OR SERVICES WHICH COMPETE WITH VIAT OR THE UW -
	! COPYRIGHT © 2025 Thomas Marchi
	! This module has it's own JS dependencies to make it easy to port to browsers do not mix it with NODE or native modules
	? Vertical and Horizontal Seed Derivation
	* Instead of using a private or public key as the source for other keys we use high-entropy large seeds
	^ <==================================================>
	1) Generate 2-3 Secret Entropy Pools: Seed, Key, Nonce
	2) Each pool must be generated using multiple sources of entropy
	3) The result is: Secret Master Seed, Secret Master Key, Secret Master Nonce (optional).
	^ <==================================================>
*/
/*
	NOTE: This is a Post-Quantum Hierarchical Deterministic Wallet & Keypair generator
	NOTE: This is for Parent to Direct Child generation per-class instance. Branch/Root with direct leaves
	TODO: Add trapdoor deterministic generation support
*/
const STATE_DEFAULTS = {
	version: 1,
	hash_algorithm: HASH_ALGORITHMS$1.SHAKE_256,
	keyed_hash_algorithm: KEYED_HASH_ALGORITHMS$1.KMAC_256_XOF,
	network_name: NETWORK_NAMES$1.VIAT,
	wallet_beta: true,
	master_seed: null,
	master_key: null,
	master_nonce: null,
	master_salt: null,
	encrypted: false,
	seed_size: MASTER_ENTROPY_POOL_SIZES$1.DEFAULT,
};
class HDSeed {
	constructor(preConfig) {
		return this;
	}
	static STATE_DEFAULTS = STATE_DEFAULTS;
	static VALID_PROPERTY_NAMES = VALID_PROPERTY_NAMES;
	static PROPERTY_LOOKUP = PROPERTY_LOOKUP;
	static async create(config) {
		const instance = new HDSeed(config);
		if (config && config.STATE) {
			await instance.initialize(config.STATE);
		}
		if (!config?.STATE?.master_seed) {
			await instance.createMasterSeeds();
		}
		return instance;
	}
	static async createSiteWallet(config = {}) {
		config.STATE = config.STATE || {};
		config.STATE.wallet_site_beta = true;
		const instance = await HDSeed.create(config);
		return instance;
	}
	isHDSeed = true;
	STATE = new Map(Object.entries(STATE_DEFAULTS));
	async initialize(config) {
		if (config?.STATE) {
			await this.set(config.STATE);
		}
		return this;
	}
	destroy() {
		this.STATE.clear();
		this.isHDSeed = false;
	}
	async getPreSalt(source = {}) {
		const sourceStruct = await this.generatePreSaltStruct(assign({}, source));
		const sourceStructure = await hash(await encode$1(sourceStruct), await this.get('seed_size'));
		return sourceStructure;
	}
	async getSalt(source = {}) {
		const pre_salt = await this.getPreSalt(source);
		const sourceStruct = await this.generateSaltStruct(assign({
			pre_salt,
		}, source));
		return createSalt(sourceStruct);
	}
	async getPreKey(source = {}) {
		const sourceStruct = await this.generatePreKeyStruct(assign({}, source));
		const sourceStructure = await hash(await encode$1(sourceStruct), await this.get('seed_size'));
		return sourceStructure;
	}
	async getKey(source = {}) {
		const pre_key = await this.getPreKey(source);
		const sourceStruct = await this.generateKeyStruct(assign({
			pre_key,
		}, source));
		return createKey(sourceStruct);
	}
	async getPreNonce(source = {}) {
		const sourceStruct = await this.generatePreNonceStruct(assign({}, source));
		const sourceStructure = await hash(await encode$1(sourceStruct), await this.get('seed_size'));
		return sourceStructure;
	}
	async getNonce(source = {}) {
		const pre_nonce = await this.getPreNonce(source);
		const sourceStruct = await this.generateNonceStruct(assign({
			pre_nonce,
		}, source));
		return createNonce(sourceStruct);
	}
	async getPreSeed(source = {}) {
		const sourceStruct = await this.generatePreSeedStruct(assign({}, source));
		const preSeed = await normalize(sourceStruct, await this.get('seed_size'));
		return preSeed;
	}
	async getFinalSeed(source = {}, secretHash) {
		const pre_seed = await this.getPreSeed(source);
		const finalSeedStruct = assign({
			pre_seed,
		}, source);
		if (secretHash) {
			finalSeedStruct.secret_hash = secretHash;
		}
		const sourceStruct = await this.generateSeedStruct(finalSeedStruct);
		const finalSeed = await normalize(sourceStruct, await this.get('seed_size'));
		return finalSeed;
	}
	async getSeed(source = {}, keyArg, nonceArg, guardKey, seedSizeArg) {
		const seedSize = seedSizeArg || getSeedSize(source.scheme);
		const key = (!keyArg || isPlainObject(keyArg)) ? await this.getKey(keyArg || source) : keyArg;
		const nonce = (!nonceArg || isPlainObject(nonceArg)) ? await this.getNonce(nonceArg || source) : nonceArg;
		const finalSeed = await this.getFinalSeed(source, guardKey);
		const customization = await encode$1(assign({
			nonce,
		}, source));
		const seed = await kmac(key, finalSeed, seedSize, customization);
		return seed;
	}
	async getTrapdoorSeed(source = {}, keyArg, nonceArg, guardKey, seedSizeArg) {
		const seedConfig = assign({
			trapdoor: true,
			alt_object_type: OBJECT_TYPE.TRAPDOOR,
			alt_purpose: PURPOSE$1.TRAPDOOR,
		}, source);
		return this.getSeed(seedConfig, keyArg, nonceArg, guardKey, seedSizeArg);
	}
	async getWalletSeed(source = {}, seedSize) {
		const seed = await this.getSeed(source, null, null, null, seedSize);
		const trapdoorSeed = await this.getTrapdoorSeed(source, null, null, null, seedSize);
		return {
			seed,
			trapdoorSeed,
		};
	}
	async exportBinary() {
		const source = await this.exportObject();
		return encode$1(source);
	}
}
extendClass(HDSeed, masterMethods, info, structMethods, stateMethods);

var browser = {};

var canPromise;
var hasRequiredCanPromise;

function requireCanPromise () {
	if (hasRequiredCanPromise) return canPromise;
	hasRequiredCanPromise = 1;
	// can-promise has a crash in some versions of react native that dont have
	// standard global objects
	// https://github.com/soldair/node-qrcode/issues/157

	canPromise = function () {
	  return typeof Promise === 'function' && Promise.prototype && Promise.prototype.then
	};
	return canPromise;
}

var qrcode = {};

var utils$1 = {};

var hasRequiredUtils$1;

function requireUtils$1 () {
	if (hasRequiredUtils$1) return utils$1;
	hasRequiredUtils$1 = 1;
	let toSJISFunction;
	const CODEWORDS_COUNT = [
	  0, // Not used
	  26, 44, 70, 100, 134, 172, 196, 242, 292, 346,
	  404, 466, 532, 581, 655, 733, 815, 901, 991, 1085,
	  1156, 1258, 1364, 1474, 1588, 1706, 1828, 1921, 2051, 2185,
	  2323, 2465, 2611, 2761, 2876, 3034, 3196, 3362, 3532, 3706
	];

	/**
	 * Returns the QR Code size for the specified version
	 *
	 * @param  {Number} version QR Code version
	 * @return {Number}         size of QR code
	 */
	utils$1.getSymbolSize = function getSymbolSize (version) {
	  if (!version) throw new Error('"version" cannot be null or undefined')
	  if (version < 1 || version > 40) throw new Error('"version" should be in range from 1 to 40')
	  return version * 4 + 17
	};

	/**
	 * Returns the total number of codewords used to store data and EC information.
	 *
	 * @param  {Number} version QR Code version
	 * @return {Number}         Data length in bits
	 */
	utils$1.getSymbolTotalCodewords = function getSymbolTotalCodewords (version) {
	  return CODEWORDS_COUNT[version]
	};

	/**
	 * Encode data with Bose-Chaudhuri-Hocquenghem
	 *
	 * @param  {Number} data Value to encode
	 * @return {Number}      Encoded value
	 */
	utils$1.getBCHDigit = function (data) {
	  let digit = 0;

	  while (data !== 0) {
	    digit++;
	    data >>>= 1;
	  }

	  return digit
	};

	utils$1.setToSJISFunction = function setToSJISFunction (f) {
	  if (typeof f !== 'function') {
	    throw new Error('"toSJISFunc" is not a valid function.')
	  }

	  toSJISFunction = f;
	};

	utils$1.isKanjiModeEnabled = function () {
	  return typeof toSJISFunction !== 'undefined'
	};

	utils$1.toSJIS = function toSJIS (kanji) {
	  return toSJISFunction(kanji)
	};
	return utils$1;
}

var errorCorrectionLevel = {};

var hasRequiredErrorCorrectionLevel;

function requireErrorCorrectionLevel () {
	if (hasRequiredErrorCorrectionLevel) return errorCorrectionLevel;
	hasRequiredErrorCorrectionLevel = 1;
	(function (exports$1) {
		exports$1.L = { bit: 1 };
		exports$1.M = { bit: 0 };
		exports$1.Q = { bit: 3 };
		exports$1.H = { bit: 2 };

		function fromString (string) {
		  if (typeof string !== 'string') {
		    throw new Error('Param is not a string')
		  }

		  const lcStr = string.toLowerCase();

		  switch (lcStr) {
		    case 'l':
		    case 'low':
		      return exports$1.L

		    case 'm':
		    case 'medium':
		      return exports$1.M

		    case 'q':
		    case 'quartile':
		      return exports$1.Q

		    case 'h':
		    case 'high':
		      return exports$1.H

		    default:
		      throw new Error('Unknown EC Level: ' + string)
		  }
		}

		exports$1.isValid = function isValid (level) {
		  return level && typeof level.bit !== 'undefined' &&
		    level.bit >= 0 && level.bit < 4
		};

		exports$1.from = function from (value, defaultValue) {
		  if (exports$1.isValid(value)) {
		    return value
		  }

		  try {
		    return fromString(value)
		  } catch (e) {
		    return defaultValue
		  }
		}; 
	} (errorCorrectionLevel));
	return errorCorrectionLevel;
}

var bitBuffer;
var hasRequiredBitBuffer;

function requireBitBuffer () {
	if (hasRequiredBitBuffer) return bitBuffer;
	hasRequiredBitBuffer = 1;
	function BitBuffer () {
	  this.buffer = [];
	  this.length = 0;
	}

	BitBuffer.prototype = {

	  get: function (index) {
	    const bufIndex = Math.floor(index / 8);
	    return ((this.buffer[bufIndex] >>> (7 - index % 8)) & 1) === 1
	  },

	  put: function (num, length) {
	    for (let i = 0; i < length; i++) {
	      this.putBit(((num >>> (length - i - 1)) & 1) === 1);
	    }
	  },

	  getLengthInBits: function () {
	    return this.length
	  },

	  putBit: function (bit) {
	    const bufIndex = Math.floor(this.length / 8);
	    if (this.buffer.length <= bufIndex) {
	      this.buffer.push(0);
	    }

	    if (bit) {
	      this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
	    }

	    this.length++;
	  }
	};

	bitBuffer = BitBuffer;
	return bitBuffer;
}

/**
 * Helper class to handle QR Code symbol modules
 *
 * @param {Number} size Symbol size
 */

var bitMatrix;
var hasRequiredBitMatrix;

function requireBitMatrix () {
	if (hasRequiredBitMatrix) return bitMatrix;
	hasRequiredBitMatrix = 1;
	function BitMatrix (size) {
	  if (!size || size < 1) {
	    throw new Error('BitMatrix size must be defined and greater than 0')
	  }

	  this.size = size;
	  this.data = new Uint8Array(size * size);
	  this.reservedBit = new Uint8Array(size * size);
	}

	/**
	 * Set bit value at specified location
	 * If reserved flag is set, this bit will be ignored during masking process
	 *
	 * @param {Number}  row
	 * @param {Number}  col
	 * @param {Boolean} value
	 * @param {Boolean} reserved
	 */
	BitMatrix.prototype.set = function (row, col, value, reserved) {
	  const index = row * this.size + col;
	  this.data[index] = value;
	  if (reserved) this.reservedBit[index] = true;
	};

	/**
	 * Returns bit value at specified location
	 *
	 * @param  {Number}  row
	 * @param  {Number}  col
	 * @return {Boolean}
	 */
	BitMatrix.prototype.get = function (row, col) {
	  return this.data[row * this.size + col]
	};

	/**
	 * Applies xor operator at specified location
	 * (used during masking process)
	 *
	 * @param {Number}  row
	 * @param {Number}  col
	 * @param {Boolean} value
	 */
	BitMatrix.prototype.xor = function (row, col, value) {
	  this.data[row * this.size + col] ^= value;
	};

	/**
	 * Check if bit at specified location is reserved
	 *
	 * @param {Number}   row
	 * @param {Number}   col
	 * @return {Boolean}
	 */
	BitMatrix.prototype.isReserved = function (row, col) {
	  return this.reservedBit[row * this.size + col]
	};

	bitMatrix = BitMatrix;
	return bitMatrix;
}

var alignmentPattern = {};

/**
 * Alignment pattern are fixed reference pattern in defined positions
 * in a matrix symbology, which enables the decode software to re-synchronise
 * the coordinate mapping of the image modules in the event of moderate amounts
 * of distortion of the image.
 *
 * Alignment patterns are present only in QR Code symbols of version 2 or larger
 * and their number depends on the symbol version.
 */

var hasRequiredAlignmentPattern;

function requireAlignmentPattern () {
	if (hasRequiredAlignmentPattern) return alignmentPattern;
	hasRequiredAlignmentPattern = 1;
	(function (exports$1) {
		const getSymbolSize = requireUtils$1().getSymbolSize;

		/**
		 * Calculate the row/column coordinates of the center module of each alignment pattern
		 * for the specified QR Code version.
		 *
		 * The alignment patterns are positioned symmetrically on either side of the diagonal
		 * running from the top left corner of the symbol to the bottom right corner.
		 *
		 * Since positions are simmetrical only half of the coordinates are returned.
		 * Each item of the array will represent in turn the x and y coordinate.
		 * @see {@link getPositions}
		 *
		 * @param  {Number} version QR Code version
		 * @return {Array}          Array of coordinate
		 */
		exports$1.getRowColCoords = function getRowColCoords (version) {
		  if (version === 1) return []

		  const posCount = Math.floor(version / 7) + 2;
		  const size = getSymbolSize(version);
		  const intervals = size === 145 ? 26 : Math.ceil((size - 13) / (2 * posCount - 2)) * 2;
		  const positions = [size - 7]; // Last coord is always (size - 7)

		  for (let i = 1; i < posCount - 1; i++) {
		    positions[i] = positions[i - 1] - intervals;
		  }

		  positions.push(6); // First coord is always 6

		  return positions.reverse()
		};

		/**
		 * Returns an array containing the positions of each alignment pattern.
		 * Each array's element represent the center point of the pattern as (x, y) coordinates
		 *
		 * Coordinates are calculated expanding the row/column coordinates returned by {@link getRowColCoords}
		 * and filtering out the items that overlaps with finder pattern
		 *
		 * @example
		 * For a Version 7 symbol {@link getRowColCoords} returns values 6, 22 and 38.
		 * The alignment patterns, therefore, are to be centered on (row, column)
		 * positions (6,22), (22,6), (22,22), (22,38), (38,22), (38,38).
		 * Note that the coordinates (6,6), (6,38), (38,6) are occupied by finder patterns
		 * and are not therefore used for alignment patterns.
		 *
		 * let pos = getPositions(7)
		 * // [[6,22], [22,6], [22,22], [22,38], [38,22], [38,38]]
		 *
		 * @param  {Number} version QR Code version
		 * @return {Array}          Array of coordinates
		 */
		exports$1.getPositions = function getPositions (version) {
		  const coords = [];
		  const pos = exports$1.getRowColCoords(version);
		  const posLength = pos.length;

		  for (let i = 0; i < posLength; i++) {
		    for (let j = 0; j < posLength; j++) {
		      // Skip if position is occupied by finder patterns
		      if ((i === 0 && j === 0) || // top-left
		          (i === 0 && j === posLength - 1) || // bottom-left
		          (i === posLength - 1 && j === 0)) { // top-right
		        continue
		      }

		      coords.push([pos[i], pos[j]]);
		    }
		  }

		  return coords
		}; 
	} (alignmentPattern));
	return alignmentPattern;
}

var finderPattern = {};

var hasRequiredFinderPattern;

function requireFinderPattern () {
	if (hasRequiredFinderPattern) return finderPattern;
	hasRequiredFinderPattern = 1;
	const getSymbolSize = requireUtils$1().getSymbolSize;
	const FINDER_PATTERN_SIZE = 7;

	/**
	 * Returns an array containing the positions of each finder pattern.
	 * Each array's element represent the top-left point of the pattern as (x, y) coordinates
	 *
	 * @param  {Number} version QR Code version
	 * @return {Array}          Array of coordinates
	 */
	finderPattern.getPositions = function getPositions (version) {
	  const size = getSymbolSize(version);

	  return [
	    // top-left
	    [0, 0],
	    // top-right
	    [size - FINDER_PATTERN_SIZE, 0],
	    // bottom-left
	    [0, size - FINDER_PATTERN_SIZE]
	  ]
	};
	return finderPattern;
}

var maskPattern = {};

/**
 * Data mask pattern reference
 * @type {Object}
 */

var hasRequiredMaskPattern;

function requireMaskPattern () {
	if (hasRequiredMaskPattern) return maskPattern;
	hasRequiredMaskPattern = 1;
	(function (exports$1) {
		exports$1.Patterns = {
		  PATTERN000: 0,
		  PATTERN001: 1,
		  PATTERN010: 2,
		  PATTERN011: 3,
		  PATTERN100: 4,
		  PATTERN101: 5,
		  PATTERN110: 6,
		  PATTERN111: 7
		};

		/**
		 * Weighted penalty scores for the undesirable features
		 * @type {Object}
		 */
		const PenaltyScores = {
		  N1: 3,
		  N2: 3,
		  N3: 40,
		  N4: 10
		};

		/**
		 * Check if mask pattern value is valid
		 *
		 * @param  {Number}  mask    Mask pattern
		 * @return {Boolean}         true if valid, false otherwise
		 */
		exports$1.isValid = function isValid (mask) {
		  return mask != null && mask !== '' && !isNaN(mask) && mask >= 0 && mask <= 7
		};

		/**
		 * Returns mask pattern from a value.
		 * If value is not valid, returns undefined
		 *
		 * @param  {Number|String} value        Mask pattern value
		 * @return {Number}                     Valid mask pattern or undefined
		 */
		exports$1.from = function from (value) {
		  return exports$1.isValid(value) ? parseInt(value, 10) : undefined
		};

		/**
		* Find adjacent modules in row/column with the same color
		* and assign a penalty value.
		*
		* Points: N1 + i
		* i is the amount by which the number of adjacent modules of the same color exceeds 5
		*/
		exports$1.getPenaltyN1 = function getPenaltyN1 (data) {
		  const size = data.size;
		  let points = 0;
		  let sameCountCol = 0;
		  let sameCountRow = 0;
		  let lastCol = null;
		  let lastRow = null;

		  for (let row = 0; row < size; row++) {
		    sameCountCol = sameCountRow = 0;
		    lastCol = lastRow = null;

		    for (let col = 0; col < size; col++) {
		      let module = data.get(row, col);
		      if (module === lastCol) {
		        sameCountCol++;
		      } else {
		        if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5);
		        lastCol = module;
		        sameCountCol = 1;
		      }

		      module = data.get(col, row);
		      if (module === lastRow) {
		        sameCountRow++;
		      } else {
		        if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5);
		        lastRow = module;
		        sameCountRow = 1;
		      }
		    }

		    if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5);
		    if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5);
		  }

		  return points
		};

		/**
		 * Find 2x2 blocks with the same color and assign a penalty value
		 *
		 * Points: N2 * (m - 1) * (n - 1)
		 */
		exports$1.getPenaltyN2 = function getPenaltyN2 (data) {
		  const size = data.size;
		  let points = 0;

		  for (let row = 0; row < size - 1; row++) {
		    for (let col = 0; col < size - 1; col++) {
		      const last = data.get(row, col) +
		        data.get(row, col + 1) +
		        data.get(row + 1, col) +
		        data.get(row + 1, col + 1);

		      if (last === 4 || last === 0) points++;
		    }
		  }

		  return points * PenaltyScores.N2
		};

		/**
		 * Find 1:1:3:1:1 ratio (dark:light:dark:light:dark) pattern in row/column,
		 * preceded or followed by light area 4 modules wide
		 *
		 * Points: N3 * number of pattern found
		 */
		exports$1.getPenaltyN3 = function getPenaltyN3 (data) {
		  const size = data.size;
		  let points = 0;
		  let bitsCol = 0;
		  let bitsRow = 0;

		  for (let row = 0; row < size; row++) {
		    bitsCol = bitsRow = 0;
		    for (let col = 0; col < size; col++) {
		      bitsCol = ((bitsCol << 1) & 0x7FF) | data.get(row, col);
		      if (col >= 10 && (bitsCol === 0x5D0 || bitsCol === 0x05D)) points++;

		      bitsRow = ((bitsRow << 1) & 0x7FF) | data.get(col, row);
		      if (col >= 10 && (bitsRow === 0x5D0 || bitsRow === 0x05D)) points++;
		    }
		  }

		  return points * PenaltyScores.N3
		};

		/**
		 * Calculate proportion of dark modules in entire symbol
		 *
		 * Points: N4 * k
		 *
		 * k is the rating of the deviation of the proportion of dark modules
		 * in the symbol from 50% in steps of 5%
		 */
		exports$1.getPenaltyN4 = function getPenaltyN4 (data) {
		  let darkCount = 0;
		  const modulesCount = data.data.length;

		  for (let i = 0; i < modulesCount; i++) darkCount += data.data[i];

		  const k = Math.abs(Math.ceil((darkCount * 100 / modulesCount) / 5) - 10);

		  return k * PenaltyScores.N4
		};

		/**
		 * Return mask value at given position
		 *
		 * @param  {Number} maskPattern Pattern reference value
		 * @param  {Number} i           Row
		 * @param  {Number} j           Column
		 * @return {Boolean}            Mask value
		 */
		function getMaskAt (maskPattern, i, j) {
		  switch (maskPattern) {
		    case exports$1.Patterns.PATTERN000: return (i + j) % 2 === 0
		    case exports$1.Patterns.PATTERN001: return i % 2 === 0
		    case exports$1.Patterns.PATTERN010: return j % 3 === 0
		    case exports$1.Patterns.PATTERN011: return (i + j) % 3 === 0
		    case exports$1.Patterns.PATTERN100: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0
		    case exports$1.Patterns.PATTERN101: return (i * j) % 2 + (i * j) % 3 === 0
		    case exports$1.Patterns.PATTERN110: return ((i * j) % 2 + (i * j) % 3) % 2 === 0
		    case exports$1.Patterns.PATTERN111: return ((i * j) % 3 + (i + j) % 2) % 2 === 0

		    default: throw new Error('bad maskPattern:' + maskPattern)
		  }
		}

		/**
		 * Apply a mask pattern to a BitMatrix
		 *
		 * @param  {Number}    pattern Pattern reference number
		 * @param  {BitMatrix} data    BitMatrix data
		 */
		exports$1.applyMask = function applyMask (pattern, data) {
		  const size = data.size;

		  for (let col = 0; col < size; col++) {
		    for (let row = 0; row < size; row++) {
		      if (data.isReserved(row, col)) continue
		      data.xor(row, col, getMaskAt(pattern, row, col));
		    }
		  }
		};

		/**
		 * Returns the best mask pattern for data
		 *
		 * @param  {BitMatrix} data
		 * @return {Number} Mask pattern reference number
		 */
		exports$1.getBestMask = function getBestMask (data, setupFormatFunc) {
		  const numPatterns = Object.keys(exports$1.Patterns).length;
		  let bestPattern = 0;
		  let lowerPenalty = Infinity;

		  for (let p = 0; p < numPatterns; p++) {
		    setupFormatFunc(p);
		    exports$1.applyMask(p, data);

		    // Calculate penalty
		    const penalty =
		      exports$1.getPenaltyN1(data) +
		      exports$1.getPenaltyN2(data) +
		      exports$1.getPenaltyN3(data) +
		      exports$1.getPenaltyN4(data);

		    // Undo previously applied mask
		    exports$1.applyMask(p, data);

		    if (penalty < lowerPenalty) {
		      lowerPenalty = penalty;
		      bestPattern = p;
		    }
		  }

		  return bestPattern
		}; 
	} (maskPattern));
	return maskPattern;
}

var errorCorrectionCode = {};

var hasRequiredErrorCorrectionCode;

function requireErrorCorrectionCode () {
	if (hasRequiredErrorCorrectionCode) return errorCorrectionCode;
	hasRequiredErrorCorrectionCode = 1;
	const ECLevel = requireErrorCorrectionLevel();

	const EC_BLOCKS_TABLE = [
	// L  M  Q  H
	  1, 1, 1, 1,
	  1, 1, 1, 1,
	  1, 1, 2, 2,
	  1, 2, 2, 4,
	  1, 2, 4, 4,
	  2, 4, 4, 4,
	  2, 4, 6, 5,
	  2, 4, 6, 6,
	  2, 5, 8, 8,
	  4, 5, 8, 8,
	  4, 5, 8, 11,
	  4, 8, 10, 11,
	  4, 9, 12, 16,
	  4, 9, 16, 16,
	  6, 10, 12, 18,
	  6, 10, 17, 16,
	  6, 11, 16, 19,
	  6, 13, 18, 21,
	  7, 14, 21, 25,
	  8, 16, 20, 25,
	  8, 17, 23, 25,
	  9, 17, 23, 34,
	  9, 18, 25, 30,
	  10, 20, 27, 32,
	  12, 21, 29, 35,
	  12, 23, 34, 37,
	  12, 25, 34, 40,
	  13, 26, 35, 42,
	  14, 28, 38, 45,
	  15, 29, 40, 48,
	  16, 31, 43, 51,
	  17, 33, 45, 54,
	  18, 35, 48, 57,
	  19, 37, 51, 60,
	  19, 38, 53, 63,
	  20, 40, 56, 66,
	  21, 43, 59, 70,
	  22, 45, 62, 74,
	  24, 47, 65, 77,
	  25, 49, 68, 81
	];

	const EC_CODEWORDS_TABLE = [
	// L  M  Q  H
	  7, 10, 13, 17,
	  10, 16, 22, 28,
	  15, 26, 36, 44,
	  20, 36, 52, 64,
	  26, 48, 72, 88,
	  36, 64, 96, 112,
	  40, 72, 108, 130,
	  48, 88, 132, 156,
	  60, 110, 160, 192,
	  72, 130, 192, 224,
	  80, 150, 224, 264,
	  96, 176, 260, 308,
	  104, 198, 288, 352,
	  120, 216, 320, 384,
	  132, 240, 360, 432,
	  144, 280, 408, 480,
	  168, 308, 448, 532,
	  180, 338, 504, 588,
	  196, 364, 546, 650,
	  224, 416, 600, 700,
	  224, 442, 644, 750,
	  252, 476, 690, 816,
	  270, 504, 750, 900,
	  300, 560, 810, 960,
	  312, 588, 870, 1050,
	  336, 644, 952, 1110,
	  360, 700, 1020, 1200,
	  390, 728, 1050, 1260,
	  420, 784, 1140, 1350,
	  450, 812, 1200, 1440,
	  480, 868, 1290, 1530,
	  510, 924, 1350, 1620,
	  540, 980, 1440, 1710,
	  570, 1036, 1530, 1800,
	  570, 1064, 1590, 1890,
	  600, 1120, 1680, 1980,
	  630, 1204, 1770, 2100,
	  660, 1260, 1860, 2220,
	  720, 1316, 1950, 2310,
	  750, 1372, 2040, 2430
	];

	/**
	 * Returns the number of error correction block that the QR Code should contain
	 * for the specified version and error correction level.
	 *
	 * @param  {Number} version              QR Code version
	 * @param  {Number} errorCorrectionLevel Error correction level
	 * @return {Number}                      Number of error correction blocks
	 */
	errorCorrectionCode.getBlocksCount = function getBlocksCount (version, errorCorrectionLevel) {
	  switch (errorCorrectionLevel) {
	    case ECLevel.L:
	      return EC_BLOCKS_TABLE[(version - 1) * 4 + 0]
	    case ECLevel.M:
	      return EC_BLOCKS_TABLE[(version - 1) * 4 + 1]
	    case ECLevel.Q:
	      return EC_BLOCKS_TABLE[(version - 1) * 4 + 2]
	    case ECLevel.H:
	      return EC_BLOCKS_TABLE[(version - 1) * 4 + 3]
	    default:
	      return undefined
	  }
	};

	/**
	 * Returns the number of error correction codewords to use for the specified
	 * version and error correction level.
	 *
	 * @param  {Number} version              QR Code version
	 * @param  {Number} errorCorrectionLevel Error correction level
	 * @return {Number}                      Number of error correction codewords
	 */
	errorCorrectionCode.getTotalCodewordsCount = function getTotalCodewordsCount (version, errorCorrectionLevel) {
	  switch (errorCorrectionLevel) {
	    case ECLevel.L:
	      return EC_CODEWORDS_TABLE[(version - 1) * 4 + 0]
	    case ECLevel.M:
	      return EC_CODEWORDS_TABLE[(version - 1) * 4 + 1]
	    case ECLevel.Q:
	      return EC_CODEWORDS_TABLE[(version - 1) * 4 + 2]
	    case ECLevel.H:
	      return EC_CODEWORDS_TABLE[(version - 1) * 4 + 3]
	    default:
	      return undefined
	  }
	};
	return errorCorrectionCode;
}

var polynomial = {};

var galoisField = {};

var hasRequiredGaloisField;

function requireGaloisField () {
	if (hasRequiredGaloisField) return galoisField;
	hasRequiredGaloisField = 1;
	const EXP_TABLE = new Uint8Array(512);
	const LOG_TABLE = new Uint8Array(256)
	/**
	 * Precompute the log and anti-log tables for faster computation later
	 *
	 * For each possible value in the galois field 2^8, we will pre-compute
	 * the logarithm and anti-logarithm (exponential) of this value
	 *
	 * ref {@link https://en.wikiversity.org/wiki/Reed%E2%80%93Solomon_codes_for_coders#Introduction_to_mathematical_fields}
	 */
	;(function initTables () {
	  let x = 1;
	  for (let i = 0; i < 255; i++) {
	    EXP_TABLE[i] = x;
	    LOG_TABLE[x] = i;

	    x <<= 1; // multiply by 2

	    // The QR code specification says to use byte-wise modulo 100011101 arithmetic.
	    // This means that when a number is 256 or larger, it should be XORed with 0x11D.
	    if (x & 0x100) { // similar to x >= 256, but a lot faster (because 0x100 == 256)
	      x ^= 0x11D;
	    }
	  }

	  // Optimization: double the size of the anti-log table so that we don't need to mod 255 to
	  // stay inside the bounds (because we will mainly use this table for the multiplication of
	  // two GF numbers, no more).
	  // @see {@link mul}
	  for (let i = 255; i < 512; i++) {
	    EXP_TABLE[i] = EXP_TABLE[i - 255];
	  }
	}());

	/**
	 * Returns log value of n inside Galois Field
	 *
	 * @param  {Number} n
	 * @return {Number}
	 */
	galoisField.log = function log (n) {
	  if (n < 1) throw new Error('log(' + n + ')')
	  return LOG_TABLE[n]
	};

	/**
	 * Returns anti-log value of n inside Galois Field
	 *
	 * @param  {Number} n
	 * @return {Number}
	 */
	galoisField.exp = function exp (n) {
	  return EXP_TABLE[n]
	};

	/**
	 * Multiplies two number inside Galois Field
	 *
	 * @param  {Number} x
	 * @param  {Number} y
	 * @return {Number}
	 */
	galoisField.mul = function mul (x, y) {
	  if (x === 0 || y === 0) return 0

	  // should be EXP_TABLE[(LOG_TABLE[x] + LOG_TABLE[y]) % 255] if EXP_TABLE wasn't oversized
	  // @see {@link initTables}
	  return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]]
	};
	return galoisField;
}

var hasRequiredPolynomial;

function requirePolynomial () {
	if (hasRequiredPolynomial) return polynomial;
	hasRequiredPolynomial = 1;
	(function (exports$1) {
		const GF = requireGaloisField();

		/**
		 * Multiplies two polynomials inside Galois Field
		 *
		 * @param  {Uint8Array} p1 Polynomial
		 * @param  {Uint8Array} p2 Polynomial
		 * @return {Uint8Array}    Product of p1 and p2
		 */
		exports$1.mul = function mul (p1, p2) {
		  const coeff = new Uint8Array(p1.length + p2.length - 1);

		  for (let i = 0; i < p1.length; i++) {
		    for (let j = 0; j < p2.length; j++) {
		      coeff[i + j] ^= GF.mul(p1[i], p2[j]);
		    }
		  }

		  return coeff
		};

		/**
		 * Calculate the remainder of polynomials division
		 *
		 * @param  {Uint8Array} divident Polynomial
		 * @param  {Uint8Array} divisor  Polynomial
		 * @return {Uint8Array}          Remainder
		 */
		exports$1.mod = function mod (divident, divisor) {
		  let result = new Uint8Array(divident);

		  while ((result.length - divisor.length) >= 0) {
		    const coeff = result[0];

		    for (let i = 0; i < divisor.length; i++) {
		      result[i] ^= GF.mul(divisor[i], coeff);
		    }

		    // remove all zeros from buffer head
		    let offset = 0;
		    while (offset < result.length && result[offset] === 0) offset++;
		    result = result.slice(offset);
		  }

		  return result
		};

		/**
		 * Generate an irreducible generator polynomial of specified degree
		 * (used by Reed-Solomon encoder)
		 *
		 * @param  {Number} degree Degree of the generator polynomial
		 * @return {Uint8Array}    Buffer containing polynomial coefficients
		 */
		exports$1.generateECPolynomial = function generateECPolynomial (degree) {
		  let poly = new Uint8Array([1]);
		  for (let i = 0; i < degree; i++) {
		    poly = exports$1.mul(poly, new Uint8Array([1, GF.exp(i)]));
		  }

		  return poly
		}; 
	} (polynomial));
	return polynomial;
}

var reedSolomonEncoder;
var hasRequiredReedSolomonEncoder;

function requireReedSolomonEncoder () {
	if (hasRequiredReedSolomonEncoder) return reedSolomonEncoder;
	hasRequiredReedSolomonEncoder = 1;
	const Polynomial = requirePolynomial();

	function ReedSolomonEncoder (degree) {
	  this.genPoly = undefined;
	  this.degree = degree;

	  if (this.degree) this.initialize(this.degree);
	}

	/**
	 * Initialize the encoder.
	 * The input param should correspond to the number of error correction codewords.
	 *
	 * @param  {Number} degree
	 */
	ReedSolomonEncoder.prototype.initialize = function initialize (degree) {
	  // create an irreducible generator polynomial
	  this.degree = degree;
	  this.genPoly = Polynomial.generateECPolynomial(this.degree);
	};

	/**
	 * Encodes a chunk of data
	 *
	 * @param  {Uint8Array} data Buffer containing input data
	 * @return {Uint8Array}      Buffer containing encoded data
	 */
	ReedSolomonEncoder.prototype.encode = function encode (data) {
	  if (!this.genPoly) {
	    throw new Error('Encoder not initialized')
	  }

	  // Calculate EC for this data block
	  // extends data size to data+genPoly size
	  const paddedData = new Uint8Array(data.length + this.degree);
	  paddedData.set(data);

	  // The error correction codewords are the remainder after dividing the data codewords
	  // by a generator polynomial
	  const remainder = Polynomial.mod(paddedData, this.genPoly);

	  // return EC data blocks (last n byte, where n is the degree of genPoly)
	  // If coefficients number in remainder are less than genPoly degree,
	  // pad with 0s to the left to reach the needed number of coefficients
	  const start = this.degree - remainder.length;
	  if (start > 0) {
	    const buff = new Uint8Array(this.degree);
	    buff.set(remainder, start);

	    return buff
	  }

	  return remainder
	};

	reedSolomonEncoder = ReedSolomonEncoder;
	return reedSolomonEncoder;
}

var version = {};

var mode = {};

var versionCheck = {};

/**
 * Check if QR Code version is valid
 *
 * @param  {Number}  version QR Code version
 * @return {Boolean}         true if valid version, false otherwise
 */

var hasRequiredVersionCheck;

function requireVersionCheck () {
	if (hasRequiredVersionCheck) return versionCheck;
	hasRequiredVersionCheck = 1;
	versionCheck.isValid = function isValid (version) {
	  return !isNaN(version) && version >= 1 && version <= 40
	};
	return versionCheck;
}

var regex = {};

var hasRequiredRegex;

function requireRegex () {
	if (hasRequiredRegex) return regex;
	hasRequiredRegex = 1;
	const numeric = '[0-9]+';
	const alphanumeric = '[A-Z $%*+\\-./:]+';
	let kanji = '(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|' +
	  '[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|' +
	  '[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|' +
	  '[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+';
	kanji = kanji.replace(/u/g, '\\u');

	const byte = '(?:(?![A-Z0-9 $%*+\\-./:]|' + kanji + ')(?:.|[\r\n]))+';

	regex.KANJI = new RegExp(kanji, 'g');
	regex.BYTE_KANJI = new RegExp('[^A-Z0-9 $%*+\\-./:]+', 'g');
	regex.BYTE = new RegExp(byte, 'g');
	regex.NUMERIC = new RegExp(numeric, 'g');
	regex.ALPHANUMERIC = new RegExp(alphanumeric, 'g');

	const TEST_KANJI = new RegExp('^' + kanji + '$');
	const TEST_NUMERIC = new RegExp('^' + numeric + '$');
	const TEST_ALPHANUMERIC = new RegExp('^[A-Z0-9 $%*+\\-./:]+$');

	regex.testKanji = function testKanji (str) {
	  return TEST_KANJI.test(str)
	};

	regex.testNumeric = function testNumeric (str) {
	  return TEST_NUMERIC.test(str)
	};

	regex.testAlphanumeric = function testAlphanumeric (str) {
	  return TEST_ALPHANUMERIC.test(str)
	};
	return regex;
}

var hasRequiredMode;

function requireMode () {
	if (hasRequiredMode) return mode;
	hasRequiredMode = 1;
	(function (exports$1) {
		const VersionCheck = requireVersionCheck();
		const Regex = requireRegex();

		/**
		 * Numeric mode encodes data from the decimal digit set (0 - 9)
		 * (byte values 30HEX to 39HEX).
		 * Normally, 3 data characters are represented by 10 bits.
		 *
		 * @type {Object}
		 */
		exports$1.NUMERIC = {
		  id: 'Numeric',
		  bit: 1 << 0,
		  ccBits: [10, 12, 14]
		};

		/**
		 * Alphanumeric mode encodes data from a set of 45 characters,
		 * i.e. 10 numeric digits (0 - 9),
		 *      26 alphabetic characters (A - Z),
		 *   and 9 symbols (SP, $, %, *, +, -, ., /, :).
		 * Normally, two input characters are represented by 11 bits.
		 *
		 * @type {Object}
		 */
		exports$1.ALPHANUMERIC = {
		  id: 'Alphanumeric',
		  bit: 1 << 1,
		  ccBits: [9, 11, 13]
		};

		/**
		 * In byte mode, data is encoded at 8 bits per character.
		 *
		 * @type {Object}
		 */
		exports$1.BYTE = {
		  id: 'Byte',
		  bit: 1 << 2,
		  ccBits: [8, 16, 16]
		};

		/**
		 * The Kanji mode efficiently encodes Kanji characters in accordance with
		 * the Shift JIS system based on JIS X 0208.
		 * The Shift JIS values are shifted from the JIS X 0208 values.
		 * JIS X 0208 gives details of the shift coded representation.
		 * Each two-byte character value is compacted to a 13-bit binary codeword.
		 *
		 * @type {Object}
		 */
		exports$1.KANJI = {
		  id: 'Kanji',
		  bit: 1 << 3,
		  ccBits: [8, 10, 12]
		};

		/**
		 * Mixed mode will contain a sequences of data in a combination of any of
		 * the modes described above
		 *
		 * @type {Object}
		 */
		exports$1.MIXED = {
		  bit: -1
		};

		/**
		 * Returns the number of bits needed to store the data length
		 * according to QR Code specifications.
		 *
		 * @param  {Mode}   mode    Data mode
		 * @param  {Number} version QR Code version
		 * @return {Number}         Number of bits
		 */
		exports$1.getCharCountIndicator = function getCharCountIndicator (mode, version) {
		  if (!mode.ccBits) throw new Error('Invalid mode: ' + mode)

		  if (!VersionCheck.isValid(version)) {
		    throw new Error('Invalid version: ' + version)
		  }

		  if (version >= 1 && version < 10) return mode.ccBits[0]
		  else if (version < 27) return mode.ccBits[1]
		  return mode.ccBits[2]
		};

		/**
		 * Returns the most efficient mode to store the specified data
		 *
		 * @param  {String} dataStr Input data string
		 * @return {Mode}           Best mode
		 */
		exports$1.getBestModeForData = function getBestModeForData (dataStr) {
		  if (Regex.testNumeric(dataStr)) return exports$1.NUMERIC
		  else if (Regex.testAlphanumeric(dataStr)) return exports$1.ALPHANUMERIC
		  else if (Regex.testKanji(dataStr)) return exports$1.KANJI
		  else return exports$1.BYTE
		};

		/**
		 * Return mode name as string
		 *
		 * @param {Mode} mode Mode object
		 * @returns {String}  Mode name
		 */
		exports$1.toString = function toString (mode) {
		  if (mode && mode.id) return mode.id
		  throw new Error('Invalid mode')
		};

		/**
		 * Check if input param is a valid mode object
		 *
		 * @param   {Mode}    mode Mode object
		 * @returns {Boolean} True if valid mode, false otherwise
		 */
		exports$1.isValid = function isValid (mode) {
		  return mode && mode.bit && mode.ccBits
		};

		/**
		 * Get mode object from its name
		 *
		 * @param   {String} string Mode name
		 * @returns {Mode}          Mode object
		 */
		function fromString (string) {
		  if (typeof string !== 'string') {
		    throw new Error('Param is not a string')
		  }

		  const lcStr = string.toLowerCase();

		  switch (lcStr) {
		    case 'numeric':
		      return exports$1.NUMERIC
		    case 'alphanumeric':
		      return exports$1.ALPHANUMERIC
		    case 'kanji':
		      return exports$1.KANJI
		    case 'byte':
		      return exports$1.BYTE
		    default:
		      throw new Error('Unknown mode: ' + string)
		  }
		}

		/**
		 * Returns mode from a value.
		 * If value is not a valid mode, returns defaultValue
		 *
		 * @param  {Mode|String} value        Encoding mode
		 * @param  {Mode}        defaultValue Fallback value
		 * @return {Mode}                     Encoding mode
		 */
		exports$1.from = function from (value, defaultValue) {
		  if (exports$1.isValid(value)) {
		    return value
		  }

		  try {
		    return fromString(value)
		  } catch (e) {
		    return defaultValue
		  }
		}; 
	} (mode));
	return mode;
}

var hasRequiredVersion;

function requireVersion () {
	if (hasRequiredVersion) return version;
	hasRequiredVersion = 1;
	(function (exports$1) {
		const Utils = requireUtils$1();
		const ECCode = requireErrorCorrectionCode();
		const ECLevel = requireErrorCorrectionLevel();
		const Mode = requireMode();
		const VersionCheck = requireVersionCheck();

		// Generator polynomial used to encode version information
		const G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
		const G18_BCH = Utils.getBCHDigit(G18);

		function getBestVersionForDataLength (mode, length, errorCorrectionLevel) {
		  for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
		    if (length <= exports$1.getCapacity(currentVersion, errorCorrectionLevel, mode)) {
		      return currentVersion
		    }
		  }

		  return undefined
		}

		function getReservedBitsCount (mode, version) {
		  // Character count indicator + mode indicator bits
		  return Mode.getCharCountIndicator(mode, version) + 4
		}

		function getTotalBitsFromDataArray (segments, version) {
		  let totalBits = 0;

		  segments.forEach(function (data) {
		    const reservedBits = getReservedBitsCount(data.mode, version);
		    totalBits += reservedBits + data.getBitsLength();
		  });

		  return totalBits
		}

		function getBestVersionForMixedData (segments, errorCorrectionLevel) {
		  for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
		    const length = getTotalBitsFromDataArray(segments, currentVersion);
		    if (length <= exports$1.getCapacity(currentVersion, errorCorrectionLevel, Mode.MIXED)) {
		      return currentVersion
		    }
		  }

		  return undefined
		}

		/**
		 * Returns version number from a value.
		 * If value is not a valid version, returns defaultValue
		 *
		 * @param  {Number|String} value        QR Code version
		 * @param  {Number}        defaultValue Fallback value
		 * @return {Number}                     QR Code version number
		 */
		exports$1.from = function from (value, defaultValue) {
		  if (VersionCheck.isValid(value)) {
		    return parseInt(value, 10)
		  }

		  return defaultValue
		};

		/**
		 * Returns how much data can be stored with the specified QR code version
		 * and error correction level
		 *
		 * @param  {Number} version              QR Code version (1-40)
		 * @param  {Number} errorCorrectionLevel Error correction level
		 * @param  {Mode}   mode                 Data mode
		 * @return {Number}                      Quantity of storable data
		 */
		exports$1.getCapacity = function getCapacity (version, errorCorrectionLevel, mode) {
		  if (!VersionCheck.isValid(version)) {
		    throw new Error('Invalid QR Code version')
		  }

		  // Use Byte mode as default
		  if (typeof mode === 'undefined') mode = Mode.BYTE;

		  // Total codewords for this QR code version (Data + Error correction)
		  const totalCodewords = Utils.getSymbolTotalCodewords(version);

		  // Total number of error correction codewords
		  const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);

		  // Total number of data codewords
		  const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;

		  if (mode === Mode.MIXED) return dataTotalCodewordsBits

		  const usableBits = dataTotalCodewordsBits - getReservedBitsCount(mode, version);

		  // Return max number of storable codewords
		  switch (mode) {
		    case Mode.NUMERIC:
		      return Math.floor((usableBits / 10) * 3)

		    case Mode.ALPHANUMERIC:
		      return Math.floor((usableBits / 11) * 2)

		    case Mode.KANJI:
		      return Math.floor(usableBits / 13)

		    case Mode.BYTE:
		    default:
		      return Math.floor(usableBits / 8)
		  }
		};

		/**
		 * Returns the minimum version needed to contain the amount of data
		 *
		 * @param  {Segment} data                    Segment of data
		 * @param  {Number} [errorCorrectionLevel=H] Error correction level
		 * @param  {Mode} mode                       Data mode
		 * @return {Number}                          QR Code version
		 */
		exports$1.getBestVersionForData = function getBestVersionForData (data, errorCorrectionLevel) {
		  let seg;

		  const ecl = ECLevel.from(errorCorrectionLevel, ECLevel.M);

		  if (Array.isArray(data)) {
		    if (data.length > 1) {
		      return getBestVersionForMixedData(data, ecl)
		    }

		    if (data.length === 0) {
		      return 1
		    }

		    seg = data[0];
		  } else {
		    seg = data;
		  }

		  return getBestVersionForDataLength(seg.mode, seg.getLength(), ecl)
		};

		/**
		 * Returns version information with relative error correction bits
		 *
		 * The version information is included in QR Code symbols of version 7 or larger.
		 * It consists of an 18-bit sequence containing 6 data bits,
		 * with 12 error correction bits calculated using the (18, 6) Golay code.
		 *
		 * @param  {Number} version QR Code version
		 * @return {Number}         Encoded version info bits
		 */
		exports$1.getEncodedBits = function getEncodedBits (version) {
		  if (!VersionCheck.isValid(version) || version < 7) {
		    throw new Error('Invalid QR Code version')
		  }

		  let d = version << 12;

		  while (Utils.getBCHDigit(d) - G18_BCH >= 0) {
		    d ^= (G18 << (Utils.getBCHDigit(d) - G18_BCH));
		  }

		  return (version << 12) | d
		}; 
	} (version));
	return version;
}

var formatInfo = {};

var hasRequiredFormatInfo;

function requireFormatInfo () {
	if (hasRequiredFormatInfo) return formatInfo;
	hasRequiredFormatInfo = 1;
	const Utils = requireUtils$1();

	const G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
	const G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);
	const G15_BCH = Utils.getBCHDigit(G15);

	/**
	 * Returns format information with relative error correction bits
	 *
	 * The format information is a 15-bit sequence containing 5 data bits,
	 * with 10 error correction bits calculated using the (15, 5) BCH code.
	 *
	 * @param  {Number} errorCorrectionLevel Error correction level
	 * @param  {Number} mask                 Mask pattern
	 * @return {Number}                      Encoded format information bits
	 */
	formatInfo.getEncodedBits = function getEncodedBits (errorCorrectionLevel, mask) {
	  const data = ((errorCorrectionLevel.bit << 3) | mask);
	  let d = data << 10;

	  while (Utils.getBCHDigit(d) - G15_BCH >= 0) {
	    d ^= (G15 << (Utils.getBCHDigit(d) - G15_BCH));
	  }

	  // xor final data with mask pattern in order to ensure that
	  // no combination of Error Correction Level and data mask pattern
	  // will result in an all-zero data string
	  return ((data << 10) | d) ^ G15_MASK
	};
	return formatInfo;
}

var segments = {};

var numericData;
var hasRequiredNumericData;

function requireNumericData () {
	if (hasRequiredNumericData) return numericData;
	hasRequiredNumericData = 1;
	const Mode = requireMode();

	function NumericData (data) {
	  this.mode = Mode.NUMERIC;
	  this.data = data.toString();
	}

	NumericData.getBitsLength = function getBitsLength (length) {
	  return 10 * Math.floor(length / 3) + ((length % 3) ? ((length % 3) * 3 + 1) : 0)
	};

	NumericData.prototype.getLength = function getLength () {
	  return this.data.length
	};

	NumericData.prototype.getBitsLength = function getBitsLength () {
	  return NumericData.getBitsLength(this.data.length)
	};

	NumericData.prototype.write = function write (bitBuffer) {
	  let i, group, value;

	  // The input data string is divided into groups of three digits,
	  // and each group is converted to its 10-bit binary equivalent.
	  for (i = 0; i + 3 <= this.data.length; i += 3) {
	    group = this.data.substr(i, 3);
	    value = parseInt(group, 10);

	    bitBuffer.put(value, 10);
	  }

	  // If the number of input digits is not an exact multiple of three,
	  // the final one or two digits are converted to 4 or 7 bits respectively.
	  const remainingNum = this.data.length - i;
	  if (remainingNum > 0) {
	    group = this.data.substr(i);
	    value = parseInt(group, 10);

	    bitBuffer.put(value, remainingNum * 3 + 1);
	  }
	};

	numericData = NumericData;
	return numericData;
}

var alphanumericData;
var hasRequiredAlphanumericData;

function requireAlphanumericData () {
	if (hasRequiredAlphanumericData) return alphanumericData;
	hasRequiredAlphanumericData = 1;
	const Mode = requireMode();

	/**
	 * Array of characters available in alphanumeric mode
	 *
	 * As per QR Code specification, to each character
	 * is assigned a value from 0 to 44 which in this case coincides
	 * with the array index
	 *
	 * @type {Array}
	 */
	const ALPHA_NUM_CHARS = [
	  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
	  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
	  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
	  ' ', '$', '%', '*', '+', '-', '.', '/', ':'
	];

	function AlphanumericData (data) {
	  this.mode = Mode.ALPHANUMERIC;
	  this.data = data;
	}

	AlphanumericData.getBitsLength = function getBitsLength (length) {
	  return 11 * Math.floor(length / 2) + 6 * (length % 2)
	};

	AlphanumericData.prototype.getLength = function getLength () {
	  return this.data.length
	};

	AlphanumericData.prototype.getBitsLength = function getBitsLength () {
	  return AlphanumericData.getBitsLength(this.data.length)
	};

	AlphanumericData.prototype.write = function write (bitBuffer) {
	  let i;

	  // Input data characters are divided into groups of two characters
	  // and encoded as 11-bit binary codes.
	  for (i = 0; i + 2 <= this.data.length; i += 2) {
	    // The character value of the first character is multiplied by 45
	    let value = ALPHA_NUM_CHARS.indexOf(this.data[i]) * 45;

	    // The character value of the second digit is added to the product
	    value += ALPHA_NUM_CHARS.indexOf(this.data[i + 1]);

	    // The sum is then stored as 11-bit binary number
	    bitBuffer.put(value, 11);
	  }

	  // If the number of input data characters is not a multiple of two,
	  // the character value of the final character is encoded as a 6-bit binary number.
	  if (this.data.length % 2) {
	    bitBuffer.put(ALPHA_NUM_CHARS.indexOf(this.data[i]), 6);
	  }
	};

	alphanumericData = AlphanumericData;
	return alphanumericData;
}

var byteData;
var hasRequiredByteData;

function requireByteData () {
	if (hasRequiredByteData) return byteData;
	hasRequiredByteData = 1;
	const Mode = requireMode();

	function ByteData (data) {
	  this.mode = Mode.BYTE;
	  if (typeof (data) === 'string') {
	    this.data = new TextEncoder().encode(data);
	  } else {
	    this.data = new Uint8Array(data);
	  }
	}

	ByteData.getBitsLength = function getBitsLength (length) {
	  return length * 8
	};

	ByteData.prototype.getLength = function getLength () {
	  return this.data.length
	};

	ByteData.prototype.getBitsLength = function getBitsLength () {
	  return ByteData.getBitsLength(this.data.length)
	};

	ByteData.prototype.write = function (bitBuffer) {
	  for (let i = 0, l = this.data.length; i < l; i++) {
	    bitBuffer.put(this.data[i], 8);
	  }
	};

	byteData = ByteData;
	return byteData;
}

var kanjiData;
var hasRequiredKanjiData;

function requireKanjiData () {
	if (hasRequiredKanjiData) return kanjiData;
	hasRequiredKanjiData = 1;
	const Mode = requireMode();
	const Utils = requireUtils$1();

	function KanjiData (data) {
	  this.mode = Mode.KANJI;
	  this.data = data;
	}

	KanjiData.getBitsLength = function getBitsLength (length) {
	  return length * 13
	};

	KanjiData.prototype.getLength = function getLength () {
	  return this.data.length
	};

	KanjiData.prototype.getBitsLength = function getBitsLength () {
	  return KanjiData.getBitsLength(this.data.length)
	};

	KanjiData.prototype.write = function (bitBuffer) {
	  let i;

	  // In the Shift JIS system, Kanji characters are represented by a two byte combination.
	  // These byte values are shifted from the JIS X 0208 values.
	  // JIS X 0208 gives details of the shift coded representation.
	  for (i = 0; i < this.data.length; i++) {
	    let value = Utils.toSJIS(this.data[i]);

	    // For characters with Shift JIS values from 0x8140 to 0x9FFC:
	    if (value >= 0x8140 && value <= 0x9FFC) {
	      // Subtract 0x8140 from Shift JIS value
	      value -= 0x8140;

	    // For characters with Shift JIS values from 0xE040 to 0xEBBF
	    } else if (value >= 0xE040 && value <= 0xEBBF) {
	      // Subtract 0xC140 from Shift JIS value
	      value -= 0xC140;
	    } else {
	      throw new Error(
	        'Invalid SJIS character: ' + this.data[i] + '\n' +
	        'Make sure your charset is UTF-8')
	    }

	    // Multiply most significant byte of result by 0xC0
	    // and add least significant byte to product
	    value = (((value >>> 8) & 0xff) * 0xC0) + (value & 0xff);

	    // Convert result to a 13-bit binary string
	    bitBuffer.put(value, 13);
	  }
	};

	kanjiData = KanjiData;
	return kanjiData;
}

var dijkstra = {exports: {}};

var hasRequiredDijkstra;

function requireDijkstra () {
	if (hasRequiredDijkstra) return dijkstra.exports;
	hasRequiredDijkstra = 1;
	(function (module) {

		/******************************************************************************
		 * Created 2008-08-19.
		 *
		 * Dijkstra path-finding functions. Adapted from the Dijkstar Python project.
		 *
		 * Copyright (C) 2008
		 *   Wyatt Baldwin <self@wyattbaldwin.com>
		 *   All rights reserved
		 *
		 * Licensed under the MIT license.
		 *
		 *   http://www.opensource.org/licenses/mit-license.php
		 *
		 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
		 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
		 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
		 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
		 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
		 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
		 * THE SOFTWARE.
		 *****************************************************************************/
		var dijkstra = {
		  single_source_shortest_paths: function(graph, s, d) {
		    // Predecessor map for each node that has been encountered.
		    // node ID => predecessor node ID
		    var predecessors = {};

		    // Costs of shortest paths from s to all nodes encountered.
		    // node ID => cost
		    var costs = {};
		    costs[s] = 0;

		    // Costs of shortest paths from s to all nodes encountered; differs from
		    // `costs` in that it provides easy access to the node that currently has
		    // the known shortest path from s.
		    // XXX: Do we actually need both `costs` and `open`?
		    var open = dijkstra.PriorityQueue.make();
		    open.push(s, 0);

		    var closest,
		        u, v,
		        cost_of_s_to_u,
		        adjacent_nodes,
		        cost_of_e,
		        cost_of_s_to_u_plus_cost_of_e,
		        cost_of_s_to_v,
		        first_visit;
		    while (!open.empty()) {
		      // In the nodes remaining in graph that have a known cost from s,
		      // find the node, u, that currently has the shortest path from s.
		      closest = open.pop();
		      u = closest.value;
		      cost_of_s_to_u = closest.cost;

		      // Get nodes adjacent to u...
		      adjacent_nodes = graph[u] || {};

		      // ...and explore the edges that connect u to those nodes, updating
		      // the cost of the shortest paths to any or all of those nodes as
		      // necessary. v is the node across the current edge from u.
		      for (v in adjacent_nodes) {
		        if (adjacent_nodes.hasOwnProperty(v)) {
		          // Get the cost of the edge running from u to v.
		          cost_of_e = adjacent_nodes[v];

		          // Cost of s to u plus the cost of u to v across e--this is *a*
		          // cost from s to v that may or may not be less than the current
		          // known cost to v.
		          cost_of_s_to_u_plus_cost_of_e = cost_of_s_to_u + cost_of_e;

		          // If we haven't visited v yet OR if the current known cost from s to
		          // v is greater than the new cost we just found (cost of s to u plus
		          // cost of u to v across e), update v's cost in the cost list and
		          // update v's predecessor in the predecessor list (it's now u).
		          cost_of_s_to_v = costs[v];
		          first_visit = (typeof costs[v] === 'undefined');
		          if (first_visit || cost_of_s_to_v > cost_of_s_to_u_plus_cost_of_e) {
		            costs[v] = cost_of_s_to_u_plus_cost_of_e;
		            open.push(v, cost_of_s_to_u_plus_cost_of_e);
		            predecessors[v] = u;
		          }
		        }
		      }
		    }

		    if (typeof d !== 'undefined' && typeof costs[d] === 'undefined') {
		      var msg = ['Could not find a path from ', s, ' to ', d, '.'].join('');
		      throw new Error(msg);
		    }

		    return predecessors;
		  },

		  extract_shortest_path_from_predecessor_list: function(predecessors, d) {
		    var nodes = [];
		    var u = d;
		    while (u) {
		      nodes.push(u);
		      predecessors[u];
		      u = predecessors[u];
		    }
		    nodes.reverse();
		    return nodes;
		  },

		  find_path: function(graph, s, d) {
		    var predecessors = dijkstra.single_source_shortest_paths(graph, s, d);
		    return dijkstra.extract_shortest_path_from_predecessor_list(
		      predecessors, d);
		  },

		  /**
		   * A very naive priority queue implementation.
		   */
		  PriorityQueue: {
		    make: function (opts) {
		      var T = dijkstra.PriorityQueue,
		          t = {},
		          key;
		      opts = opts || {};
		      for (key in T) {
		        if (T.hasOwnProperty(key)) {
		          t[key] = T[key];
		        }
		      }
		      t.queue = [];
		      t.sorter = opts.sorter || T.default_sorter;
		      return t;
		    },

		    default_sorter: function (a, b) {
		      return a.cost - b.cost;
		    },

		    /**
		     * Add a new item to the queue and ensure the highest priority element
		     * is at the front of the queue.
		     */
		    push: function (value, cost) {
		      var item = {value: value, cost: cost};
		      this.queue.push(item);
		      this.queue.sort(this.sorter);
		    },

		    /**
		     * Return the highest priority element in the queue.
		     */
		    pop: function () {
		      return this.queue.shift();
		    },

		    empty: function () {
		      return this.queue.length === 0;
		    }
		  }
		};


		// node.js module exports
		{
		  module.exports = dijkstra;
		} 
	} (dijkstra));
	return dijkstra.exports;
}

var hasRequiredSegments;

function requireSegments () {
	if (hasRequiredSegments) return segments;
	hasRequiredSegments = 1;
	(function (exports$1) {
		const Mode = requireMode();
		const NumericData = requireNumericData();
		const AlphanumericData = requireAlphanumericData();
		const ByteData = requireByteData();
		const KanjiData = requireKanjiData();
		const Regex = requireRegex();
		const Utils = requireUtils$1();
		const dijkstra = requireDijkstra();

		/**
		 * Returns UTF8 byte length
		 *
		 * @param  {String} str Input string
		 * @return {Number}     Number of byte
		 */
		function getStringByteLength (str) {
		  return unescape(encodeURIComponent(str)).length
		}

		/**
		 * Get a list of segments of the specified mode
		 * from a string
		 *
		 * @param  {Mode}   mode Segment mode
		 * @param  {String} str  String to process
		 * @return {Array}       Array of object with segments data
		 */
		function getSegments (regex, mode, str) {
		  const segments = [];
		  let result;

		  while ((result = regex.exec(str)) !== null) {
		    segments.push({
		      data: result[0],
		      index: result.index,
		      mode: mode,
		      length: result[0].length
		    });
		  }

		  return segments
		}

		/**
		 * Extracts a series of segments with the appropriate
		 * modes from a string
		 *
		 * @param  {String} dataStr Input string
		 * @return {Array}          Array of object with segments data
		 */
		function getSegmentsFromString (dataStr) {
		  const numSegs = getSegments(Regex.NUMERIC, Mode.NUMERIC, dataStr);
		  const alphaNumSegs = getSegments(Regex.ALPHANUMERIC, Mode.ALPHANUMERIC, dataStr);
		  let byteSegs;
		  let kanjiSegs;

		  if (Utils.isKanjiModeEnabled()) {
		    byteSegs = getSegments(Regex.BYTE, Mode.BYTE, dataStr);
		    kanjiSegs = getSegments(Regex.KANJI, Mode.KANJI, dataStr);
		  } else {
		    byteSegs = getSegments(Regex.BYTE_KANJI, Mode.BYTE, dataStr);
		    kanjiSegs = [];
		  }

		  const segs = numSegs.concat(alphaNumSegs, byteSegs, kanjiSegs);

		  return segs
		    .sort(function (s1, s2) {
		      return s1.index - s2.index
		    })
		    .map(function (obj) {
		      return {
		        data: obj.data,
		        mode: obj.mode,
		        length: obj.length
		      }
		    })
		}

		/**
		 * Returns how many bits are needed to encode a string of
		 * specified length with the specified mode
		 *
		 * @param  {Number} length String length
		 * @param  {Mode} mode     Segment mode
		 * @return {Number}        Bit length
		 */
		function getSegmentBitsLength (length, mode) {
		  switch (mode) {
		    case Mode.NUMERIC:
		      return NumericData.getBitsLength(length)
		    case Mode.ALPHANUMERIC:
		      return AlphanumericData.getBitsLength(length)
		    case Mode.KANJI:
		      return KanjiData.getBitsLength(length)
		    case Mode.BYTE:
		      return ByteData.getBitsLength(length)
		  }
		}

		/**
		 * Merges adjacent segments which have the same mode
		 *
		 * @param  {Array} segs Array of object with segments data
		 * @return {Array}      Array of object with segments data
		 */
		function mergeSegments (segs) {
		  return segs.reduce(function (acc, curr) {
		    const prevSeg = acc.length - 1 >= 0 ? acc[acc.length - 1] : null;
		    if (prevSeg && prevSeg.mode === curr.mode) {
		      acc[acc.length - 1].data += curr.data;
		      return acc
		    }

		    acc.push(curr);
		    return acc
		  }, [])
		}

		/**
		 * Generates a list of all possible nodes combination which
		 * will be used to build a segments graph.
		 *
		 * Nodes are divided by groups. Each group will contain a list of all the modes
		 * in which is possible to encode the given text.
		 *
		 * For example the text '12345' can be encoded as Numeric, Alphanumeric or Byte.
		 * The group for '12345' will contain then 3 objects, one for each
		 * possible encoding mode.
		 *
		 * Each node represents a possible segment.
		 *
		 * @param  {Array} segs Array of object with segments data
		 * @return {Array}      Array of object with segments data
		 */
		function buildNodes (segs) {
		  const nodes = [];
		  for (let i = 0; i < segs.length; i++) {
		    const seg = segs[i];

		    switch (seg.mode) {
		      case Mode.NUMERIC:
		        nodes.push([seg,
		          { data: seg.data, mode: Mode.ALPHANUMERIC, length: seg.length },
		          { data: seg.data, mode: Mode.BYTE, length: seg.length }
		        ]);
		        break
		      case Mode.ALPHANUMERIC:
		        nodes.push([seg,
		          { data: seg.data, mode: Mode.BYTE, length: seg.length }
		        ]);
		        break
		      case Mode.KANJI:
		        nodes.push([seg,
		          { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
		        ]);
		        break
		      case Mode.BYTE:
		        nodes.push([
		          { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
		        ]);
		    }
		  }

		  return nodes
		}

		/**
		 * Builds a graph from a list of nodes.
		 * All segments in each node group will be connected with all the segments of
		 * the next group and so on.
		 *
		 * At each connection will be assigned a weight depending on the
		 * segment's byte length.
		 *
		 * @param  {Array} nodes    Array of object with segments data
		 * @param  {Number} version QR Code version
		 * @return {Object}         Graph of all possible segments
		 */
		function buildGraph (nodes, version) {
		  const table = {};
		  const graph = { start: {} };
		  let prevNodeIds = ['start'];

		  for (let i = 0; i < nodes.length; i++) {
		    const nodeGroup = nodes[i];
		    const currentNodeIds = [];

		    for (let j = 0; j < nodeGroup.length; j++) {
		      const node = nodeGroup[j];
		      const key = '' + i + j;

		      currentNodeIds.push(key);
		      table[key] = { node: node, lastCount: 0 };
		      graph[key] = {};

		      for (let n = 0; n < prevNodeIds.length; n++) {
		        const prevNodeId = prevNodeIds[n];

		        if (table[prevNodeId] && table[prevNodeId].node.mode === node.mode) {
		          graph[prevNodeId][key] =
		            getSegmentBitsLength(table[prevNodeId].lastCount + node.length, node.mode) -
		            getSegmentBitsLength(table[prevNodeId].lastCount, node.mode);

		          table[prevNodeId].lastCount += node.length;
		        } else {
		          if (table[prevNodeId]) table[prevNodeId].lastCount = node.length;

		          graph[prevNodeId][key] = getSegmentBitsLength(node.length, node.mode) +
		            4 + Mode.getCharCountIndicator(node.mode, version); // switch cost
		        }
		      }
		    }

		    prevNodeIds = currentNodeIds;
		  }

		  for (let n = 0; n < prevNodeIds.length; n++) {
		    graph[prevNodeIds[n]].end = 0;
		  }

		  return { map: graph, table: table }
		}

		/**
		 * Builds a segment from a specified data and mode.
		 * If a mode is not specified, the more suitable will be used.
		 *
		 * @param  {String} data             Input data
		 * @param  {Mode | String} modesHint Data mode
		 * @return {Segment}                 Segment
		 */
		function buildSingleSegment (data, modesHint) {
		  let mode;
		  const bestMode = Mode.getBestModeForData(data);

		  mode = Mode.from(modesHint, bestMode);

		  // Make sure data can be encoded
		  if (mode !== Mode.BYTE && mode.bit < bestMode.bit) {
		    throw new Error('"' + data + '"' +
		      ' cannot be encoded with mode ' + Mode.toString(mode) +
		      '.\n Suggested mode is: ' + Mode.toString(bestMode))
		  }

		  // Use Mode.BYTE if Kanji support is disabled
		  if (mode === Mode.KANJI && !Utils.isKanjiModeEnabled()) {
		    mode = Mode.BYTE;
		  }

		  switch (mode) {
		    case Mode.NUMERIC:
		      return new NumericData(data)

		    case Mode.ALPHANUMERIC:
		      return new AlphanumericData(data)

		    case Mode.KANJI:
		      return new KanjiData(data)

		    case Mode.BYTE:
		      return new ByteData(data)
		  }
		}

		/**
		 * Builds a list of segments from an array.
		 * Array can contain Strings or Objects with segment's info.
		 *
		 * For each item which is a string, will be generated a segment with the given
		 * string and the more appropriate encoding mode.
		 *
		 * For each item which is an object, will be generated a segment with the given
		 * data and mode.
		 * Objects must contain at least the property "data".
		 * If property "mode" is not present, the more suitable mode will be used.
		 *
		 * @param  {Array} array Array of objects with segments data
		 * @return {Array}       Array of Segments
		 */
		exports$1.fromArray = function fromArray (array) {
		  return array.reduce(function (acc, seg) {
		    if (typeof seg === 'string') {
		      acc.push(buildSingleSegment(seg, null));
		    } else if (seg.data) {
		      acc.push(buildSingleSegment(seg.data, seg.mode));
		    }

		    return acc
		  }, [])
		};

		/**
		 * Builds an optimized sequence of segments from a string,
		 * which will produce the shortest possible bitstream.
		 *
		 * @param  {String} data    Input string
		 * @param  {Number} version QR Code version
		 * @return {Array}          Array of segments
		 */
		exports$1.fromString = function fromString (data, version) {
		  const segs = getSegmentsFromString(data, Utils.isKanjiModeEnabled());

		  const nodes = buildNodes(segs);
		  const graph = buildGraph(nodes, version);
		  const path = dijkstra.find_path(graph.map, 'start', 'end');

		  const optimizedSegs = [];
		  for (let i = 1; i < path.length - 1; i++) {
		    optimizedSegs.push(graph.table[path[i]].node);
		  }

		  return exports$1.fromArray(mergeSegments(optimizedSegs))
		};

		/**
		 * Splits a string in various segments with the modes which
		 * best represent their content.
		 * The produced segments are far from being optimized.
		 * The output of this function is only used to estimate a QR Code version
		 * which may contain the data.
		 *
		 * @param  {string} data Input string
		 * @return {Array}       Array of segments
		 */
		exports$1.rawSplit = function rawSplit (data) {
		  return exports$1.fromArray(
		    getSegmentsFromString(data, Utils.isKanjiModeEnabled())
		  )
		}; 
	} (segments));
	return segments;
}

var hasRequiredQrcode;

function requireQrcode () {
	if (hasRequiredQrcode) return qrcode;
	hasRequiredQrcode = 1;
	const Utils = requireUtils$1();
	const ECLevel = requireErrorCorrectionLevel();
	const BitBuffer = requireBitBuffer();
	const BitMatrix = requireBitMatrix();
	const AlignmentPattern = requireAlignmentPattern();
	const FinderPattern = requireFinderPattern();
	const MaskPattern = requireMaskPattern();
	const ECCode = requireErrorCorrectionCode();
	const ReedSolomonEncoder = requireReedSolomonEncoder();
	const Version = requireVersion();
	const FormatInfo = requireFormatInfo();
	const Mode = requireMode();
	const Segments = requireSegments();

	/**
	 * QRCode for JavaScript
	 *
	 * modified by Ryan Day for nodejs support
	 * Copyright (c) 2011 Ryan Day
	 *
	 * Licensed under the MIT license:
	 *   http://www.opensource.org/licenses/mit-license.php
	 *
	//---------------------------------------------------------------------
	// QRCode for JavaScript
	//
	// Copyright (c) 2009 Kazuhiko Arase
	//
	// URL: http://www.d-project.com/
	//
	// Licensed under the MIT license:
	//   http://www.opensource.org/licenses/mit-license.php
	//
	// The word "QR Code" is registered trademark of
	// DENSO WAVE INCORPORATED
	//   http://www.denso-wave.com/qrcode/faqpatent-e.html
	//
	//---------------------------------------------------------------------
	*/

	/**
	 * Add finder patterns bits to matrix
	 *
	 * @param  {BitMatrix} matrix  Modules matrix
	 * @param  {Number}    version QR Code version
	 */
	function setupFinderPattern (matrix, version) {
	  const size = matrix.size;
	  const pos = FinderPattern.getPositions(version);

	  for (let i = 0; i < pos.length; i++) {
	    const row = pos[i][0];
	    const col = pos[i][1];

	    for (let r = -1; r <= 7; r++) {
	      if (row + r <= -1 || size <= row + r) continue

	      for (let c = -1; c <= 7; c++) {
	        if (col + c <= -1 || size <= col + c) continue

	        if ((r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
	          (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
	          (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
	          matrix.set(row + r, col + c, true, true);
	        } else {
	          matrix.set(row + r, col + c, false, true);
	        }
	      }
	    }
	  }
	}

	/**
	 * Add timing pattern bits to matrix
	 *
	 * Note: this function must be called before {@link setupAlignmentPattern}
	 *
	 * @param  {BitMatrix} matrix Modules matrix
	 */
	function setupTimingPattern (matrix) {
	  const size = matrix.size;

	  for (let r = 8; r < size - 8; r++) {
	    const value = r % 2 === 0;
	    matrix.set(r, 6, value, true);
	    matrix.set(6, r, value, true);
	  }
	}

	/**
	 * Add alignment patterns bits to matrix
	 *
	 * Note: this function must be called after {@link setupTimingPattern}
	 *
	 * @param  {BitMatrix} matrix  Modules matrix
	 * @param  {Number}    version QR Code version
	 */
	function setupAlignmentPattern (matrix, version) {
	  const pos = AlignmentPattern.getPositions(version);

	  for (let i = 0; i < pos.length; i++) {
	    const row = pos[i][0];
	    const col = pos[i][1];

	    for (let r = -2; r <= 2; r++) {
	      for (let c = -2; c <= 2; c++) {
	        if (r === -2 || r === 2 || c === -2 || c === 2 ||
	          (r === 0 && c === 0)) {
	          matrix.set(row + r, col + c, true, true);
	        } else {
	          matrix.set(row + r, col + c, false, true);
	        }
	      }
	    }
	  }
	}

	/**
	 * Add version info bits to matrix
	 *
	 * @param  {BitMatrix} matrix  Modules matrix
	 * @param  {Number}    version QR Code version
	 */
	function setupVersionInfo (matrix, version) {
	  const size = matrix.size;
	  const bits = Version.getEncodedBits(version);
	  let row, col, mod;

	  for (let i = 0; i < 18; i++) {
	    row = Math.floor(i / 3);
	    col = i % 3 + size - 8 - 3;
	    mod = ((bits >> i) & 1) === 1;

	    matrix.set(row, col, mod, true);
	    matrix.set(col, row, mod, true);
	  }
	}

	/**
	 * Add format info bits to matrix
	 *
	 * @param  {BitMatrix} matrix               Modules matrix
	 * @param  {ErrorCorrectionLevel}    errorCorrectionLevel Error correction level
	 * @param  {Number}    maskPattern          Mask pattern reference value
	 */
	function setupFormatInfo (matrix, errorCorrectionLevel, maskPattern) {
	  const size = matrix.size;
	  const bits = FormatInfo.getEncodedBits(errorCorrectionLevel, maskPattern);
	  let i, mod;

	  for (i = 0; i < 15; i++) {
	    mod = ((bits >> i) & 1) === 1;

	    // vertical
	    if (i < 6) {
	      matrix.set(i, 8, mod, true);
	    } else if (i < 8) {
	      matrix.set(i + 1, 8, mod, true);
	    } else {
	      matrix.set(size - 15 + i, 8, mod, true);
	    }

	    // horizontal
	    if (i < 8) {
	      matrix.set(8, size - i - 1, mod, true);
	    } else if (i < 9) {
	      matrix.set(8, 15 - i - 1 + 1, mod, true);
	    } else {
	      matrix.set(8, 15 - i - 1, mod, true);
	    }
	  }

	  // fixed module
	  matrix.set(size - 8, 8, 1, true);
	}

	/**
	 * Add encoded data bits to matrix
	 *
	 * @param  {BitMatrix}  matrix Modules matrix
	 * @param  {Uint8Array} data   Data codewords
	 */
	function setupData (matrix, data) {
	  const size = matrix.size;
	  let inc = -1;
	  let row = size - 1;
	  let bitIndex = 7;
	  let byteIndex = 0;

	  for (let col = size - 1; col > 0; col -= 2) {
	    if (col === 6) col--;

	    while (true) {
	      for (let c = 0; c < 2; c++) {
	        if (!matrix.isReserved(row, col - c)) {
	          let dark = false;

	          if (byteIndex < data.length) {
	            dark = (((data[byteIndex] >>> bitIndex) & 1) === 1);
	          }

	          matrix.set(row, col - c, dark);
	          bitIndex--;

	          if (bitIndex === -1) {
	            byteIndex++;
	            bitIndex = 7;
	          }
	        }
	      }

	      row += inc;

	      if (row < 0 || size <= row) {
	        row -= inc;
	        inc = -inc;
	        break
	      }
	    }
	  }
	}

	/**
	 * Create encoded codewords from data input
	 *
	 * @param  {Number}   version              QR Code version
	 * @param  {ErrorCorrectionLevel}   errorCorrectionLevel Error correction level
	 * @param  {ByteData} data                 Data input
	 * @return {Uint8Array}                    Buffer containing encoded codewords
	 */
	function createData (version, errorCorrectionLevel, segments) {
	  // Prepare data buffer
	  const buffer = new BitBuffer();

	  segments.forEach(function (data) {
	    // prefix data with mode indicator (4 bits)
	    buffer.put(data.mode.bit, 4);

	    // Prefix data with character count indicator.
	    // The character count indicator is a string of bits that represents the
	    // number of characters that are being encoded.
	    // The character count indicator must be placed after the mode indicator
	    // and must be a certain number of bits long, depending on the QR version
	    // and data mode
	    // @see {@link Mode.getCharCountIndicator}.
	    buffer.put(data.getLength(), Mode.getCharCountIndicator(data.mode, version));

	    // add binary data sequence to buffer
	    data.write(buffer);
	  });

	  // Calculate required number of bits
	  const totalCodewords = Utils.getSymbolTotalCodewords(version);
	  const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
	  const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;

	  // Add a terminator.
	  // If the bit string is shorter than the total number of required bits,
	  // a terminator of up to four 0s must be added to the right side of the string.
	  // If the bit string is more than four bits shorter than the required number of bits,
	  // add four 0s to the end.
	  if (buffer.getLengthInBits() + 4 <= dataTotalCodewordsBits) {
	    buffer.put(0, 4);
	  }

	  // If the bit string is fewer than four bits shorter, add only the number of 0s that
	  // are needed to reach the required number of bits.

	  // After adding the terminator, if the number of bits in the string is not a multiple of 8,
	  // pad the string on the right with 0s to make the string's length a multiple of 8.
	  while (buffer.getLengthInBits() % 8 !== 0) {
	    buffer.putBit(0);
	  }

	  // Add pad bytes if the string is still shorter than the total number of required bits.
	  // Extend the buffer to fill the data capacity of the symbol corresponding to
	  // the Version and Error Correction Level by adding the Pad Codewords 11101100 (0xEC)
	  // and 00010001 (0x11) alternately.
	  const remainingByte = (dataTotalCodewordsBits - buffer.getLengthInBits()) / 8;
	  for (let i = 0; i < remainingByte; i++) {
	    buffer.put(i % 2 ? 0x11 : 0xEC, 8);
	  }

	  return createCodewords(buffer, version, errorCorrectionLevel)
	}

	/**
	 * Encode input data with Reed-Solomon and return codewords with
	 * relative error correction bits
	 *
	 * @param  {BitBuffer} bitBuffer            Data to encode
	 * @param  {Number}    version              QR Code version
	 * @param  {ErrorCorrectionLevel} errorCorrectionLevel Error correction level
	 * @return {Uint8Array}                     Buffer containing encoded codewords
	 */
	function createCodewords (bitBuffer, version, errorCorrectionLevel) {
	  // Total codewords for this QR code version (Data + Error correction)
	  const totalCodewords = Utils.getSymbolTotalCodewords(version);

	  // Total number of error correction codewords
	  const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);

	  // Total number of data codewords
	  const dataTotalCodewords = totalCodewords - ecTotalCodewords;

	  // Total number of blocks
	  const ecTotalBlocks = ECCode.getBlocksCount(version, errorCorrectionLevel);

	  // Calculate how many blocks each group should contain
	  const blocksInGroup2 = totalCodewords % ecTotalBlocks;
	  const blocksInGroup1 = ecTotalBlocks - blocksInGroup2;

	  const totalCodewordsInGroup1 = Math.floor(totalCodewords / ecTotalBlocks);

	  const dataCodewordsInGroup1 = Math.floor(dataTotalCodewords / ecTotalBlocks);
	  const dataCodewordsInGroup2 = dataCodewordsInGroup1 + 1;

	  // Number of EC codewords is the same for both groups
	  const ecCount = totalCodewordsInGroup1 - dataCodewordsInGroup1;

	  // Initialize a Reed-Solomon encoder with a generator polynomial of degree ecCount
	  const rs = new ReedSolomonEncoder(ecCount);

	  let offset = 0;
	  const dcData = new Array(ecTotalBlocks);
	  const ecData = new Array(ecTotalBlocks);
	  let maxDataSize = 0;
	  const buffer = new Uint8Array(bitBuffer.buffer);

	  // Divide the buffer into the required number of blocks
	  for (let b = 0; b < ecTotalBlocks; b++) {
	    const dataSize = b < blocksInGroup1 ? dataCodewordsInGroup1 : dataCodewordsInGroup2;

	    // extract a block of data from buffer
	    dcData[b] = buffer.slice(offset, offset + dataSize);

	    // Calculate EC codewords for this data block
	    ecData[b] = rs.encode(dcData[b]);

	    offset += dataSize;
	    maxDataSize = Math.max(maxDataSize, dataSize);
	  }

	  // Create final data
	  // Interleave the data and error correction codewords from each block
	  const data = new Uint8Array(totalCodewords);
	  let index = 0;
	  let i, r;

	  // Add data codewords
	  for (i = 0; i < maxDataSize; i++) {
	    for (r = 0; r < ecTotalBlocks; r++) {
	      if (i < dcData[r].length) {
	        data[index++] = dcData[r][i];
	      }
	    }
	  }

	  // Apped EC codewords
	  for (i = 0; i < ecCount; i++) {
	    for (r = 0; r < ecTotalBlocks; r++) {
	      data[index++] = ecData[r][i];
	    }
	  }

	  return data
	}

	/**
	 * Build QR Code symbol
	 *
	 * @param  {String} data                 Input string
	 * @param  {Number} version              QR Code version
	 * @param  {ErrorCorretionLevel} errorCorrectionLevel Error level
	 * @param  {MaskPattern} maskPattern     Mask pattern
	 * @return {Object}                      Object containing symbol data
	 */
	function createSymbol (data, version, errorCorrectionLevel, maskPattern) {
	  let segments;

	  if (Array.isArray(data)) {
	    segments = Segments.fromArray(data);
	  } else if (typeof data === 'string') {
	    let estimatedVersion = version;

	    if (!estimatedVersion) {
	      const rawSegments = Segments.rawSplit(data);

	      // Estimate best version that can contain raw splitted segments
	      estimatedVersion = Version.getBestVersionForData(rawSegments, errorCorrectionLevel);
	    }

	    // Build optimized segments
	    // If estimated version is undefined, try with the highest version
	    segments = Segments.fromString(data, estimatedVersion || 40);
	  } else {
	    throw new Error('Invalid data')
	  }

	  // Get the min version that can contain data
	  const bestVersion = Version.getBestVersionForData(segments, errorCorrectionLevel);

	  // If no version is found, data cannot be stored
	  if (!bestVersion) {
	    throw new Error('The amount of data is too big to be stored in a QR Code')
	  }

	  // If not specified, use min version as default
	  if (!version) {
	    version = bestVersion;

	  // Check if the specified version can contain the data
	  } else if (version < bestVersion) {
	    throw new Error('\n' +
	      'The chosen QR Code version cannot contain this amount of data.\n' +
	      'Minimum version required to store current data is: ' + bestVersion + '.\n'
	    )
	  }

	  const dataBits = createData(version, errorCorrectionLevel, segments);

	  // Allocate matrix buffer
	  const moduleCount = Utils.getSymbolSize(version);
	  const modules = new BitMatrix(moduleCount);

	  // Add function modules
	  setupFinderPattern(modules, version);
	  setupTimingPattern(modules);
	  setupAlignmentPattern(modules, version);

	  // Add temporary dummy bits for format info just to set them as reserved.
	  // This is needed to prevent these bits from being masked by {@link MaskPattern.applyMask}
	  // since the masking operation must be performed only on the encoding region.
	  // These blocks will be replaced with correct values later in code.
	  setupFormatInfo(modules, errorCorrectionLevel, 0);

	  if (version >= 7) {
	    setupVersionInfo(modules, version);
	  }

	  // Add data codewords
	  setupData(modules, dataBits);

	  if (isNaN(maskPattern)) {
	    // Find best mask pattern
	    maskPattern = MaskPattern.getBestMask(modules,
	      setupFormatInfo.bind(null, modules, errorCorrectionLevel));
	  }

	  // Apply mask pattern
	  MaskPattern.applyMask(maskPattern, modules);

	  // Replace format info bits with correct values
	  setupFormatInfo(modules, errorCorrectionLevel, maskPattern);

	  return {
	    modules: modules,
	    version: version,
	    errorCorrectionLevel: errorCorrectionLevel,
	    maskPattern: maskPattern,
	    segments: segments
	  }
	}

	/**
	 * QR Code
	 *
	 * @param {String | Array} data                 Input data
	 * @param {Object} options                      Optional configurations
	 * @param {Number} options.version              QR Code version
	 * @param {String} options.errorCorrectionLevel Error correction level
	 * @param {Function} options.toSJISFunc         Helper func to convert utf8 to sjis
	 */
	qrcode.create = function create (data, options) {
	  if (typeof data === 'undefined' || data === '') {
	    throw new Error('No input text')
	  }

	  let errorCorrectionLevel = ECLevel.M;
	  let version;
	  let mask;

	  if (typeof options !== 'undefined') {
	    // Use higher error correction level as default
	    errorCorrectionLevel = ECLevel.from(options.errorCorrectionLevel, ECLevel.M);
	    version = Version.from(options.version);
	    mask = MaskPattern.from(options.maskPattern);

	    if (options.toSJISFunc) {
	      Utils.setToSJISFunction(options.toSJISFunc);
	    }
	  }

	  return createSymbol(data, version, errorCorrectionLevel, mask)
	};
	return qrcode;
}

var canvas = {};

var utils = {};

var hasRequiredUtils;

function requireUtils () {
	if (hasRequiredUtils) return utils;
	hasRequiredUtils = 1;
	(function (exports$1) {
		function hex2rgba (hex) {
		  if (typeof hex === 'number') {
		    hex = hex.toString();
		  }

		  if (typeof hex !== 'string') {
		    throw new Error('Color should be defined as hex string')
		  }

		  let hexCode = hex.slice().replace('#', '').split('');
		  if (hexCode.length < 3 || hexCode.length === 5 || hexCode.length > 8) {
		    throw new Error('Invalid hex color: ' + hex)
		  }

		  // Convert from short to long form (fff -> ffffff)
		  if (hexCode.length === 3 || hexCode.length === 4) {
		    hexCode = Array.prototype.concat.apply([], hexCode.map(function (c) {
		      return [c, c]
		    }));
		  }

		  // Add default alpha value
		  if (hexCode.length === 6) hexCode.push('F', 'F');

		  const hexValue = parseInt(hexCode.join(''), 16);

		  return {
		    r: (hexValue >> 24) & 255,
		    g: (hexValue >> 16) & 255,
		    b: (hexValue >> 8) & 255,
		    a: hexValue & 255,
		    hex: '#' + hexCode.slice(0, 6).join('')
		  }
		}

		exports$1.getOptions = function getOptions (options) {
		  if (!options) options = {};
		  if (!options.color) options.color = {};

		  const margin = typeof options.margin === 'undefined' ||
		    options.margin === null ||
		    options.margin < 0
		    ? 4
		    : options.margin;

		  const width = options.width && options.width >= 21 ? options.width : undefined;
		  const scale = options.scale || 4;

		  return {
		    width: width,
		    scale: width ? 4 : scale,
		    margin: margin,
		    color: {
		      dark: hex2rgba(options.color.dark || '#000000ff'),
		      light: hex2rgba(options.color.light || '#ffffffff')
		    },
		    type: options.type,
		    rendererOpts: options.rendererOpts || {}
		  }
		};

		exports$1.getScale = function getScale (qrSize, opts) {
		  return opts.width && opts.width >= qrSize + opts.margin * 2
		    ? opts.width / (qrSize + opts.margin * 2)
		    : opts.scale
		};

		exports$1.getImageWidth = function getImageWidth (qrSize, opts) {
		  const scale = exports$1.getScale(qrSize, opts);
		  return Math.floor((qrSize + opts.margin * 2) * scale)
		};

		exports$1.qrToImageData = function qrToImageData (imgData, qr, opts) {
		  const size = qr.modules.size;
		  const data = qr.modules.data;
		  const scale = exports$1.getScale(size, opts);
		  const symbolSize = Math.floor((size + opts.margin * 2) * scale);
		  const scaledMargin = opts.margin * scale;
		  const palette = [opts.color.light, opts.color.dark];

		  for (let i = 0; i < symbolSize; i++) {
		    for (let j = 0; j < symbolSize; j++) {
		      let posDst = (i * symbolSize + j) * 4;
		      let pxColor = opts.color.light;

		      if (i >= scaledMargin && j >= scaledMargin &&
		        i < symbolSize - scaledMargin && j < symbolSize - scaledMargin) {
		        const iSrc = Math.floor((i - scaledMargin) / scale);
		        const jSrc = Math.floor((j - scaledMargin) / scale);
		        pxColor = palette[data[iSrc * size + jSrc] ? 1 : 0];
		      }

		      imgData[posDst++] = pxColor.r;
		      imgData[posDst++] = pxColor.g;
		      imgData[posDst++] = pxColor.b;
		      imgData[posDst] = pxColor.a;
		    }
		  }
		}; 
	} (utils));
	return utils;
}

var hasRequiredCanvas;

function requireCanvas () {
	if (hasRequiredCanvas) return canvas;
	hasRequiredCanvas = 1;
	(function (exports$1) {
		const Utils = requireUtils();

		function clearCanvas (ctx, canvas, size) {
		  ctx.clearRect(0, 0, canvas.width, canvas.height);

		  if (!canvas.style) canvas.style = {};
		  canvas.height = size;
		  canvas.width = size;
		  canvas.style.height = size + 'px';
		  canvas.style.width = size + 'px';
		}

		function getCanvasElement () {
		  try {
		    return document.createElement('canvas')
		  } catch (e) {
		    throw new Error('You need to specify a canvas element')
		  }
		}

		exports$1.render = function render (qrData, canvas, options) {
		  let opts = options;
		  let canvasEl = canvas;

		  if (typeof opts === 'undefined' && (!canvas || !canvas.getContext)) {
		    opts = canvas;
		    canvas = undefined;
		  }

		  if (!canvas) {
		    canvasEl = getCanvasElement();
		  }

		  opts = Utils.getOptions(opts);
		  const size = Utils.getImageWidth(qrData.modules.size, opts);

		  const ctx = canvasEl.getContext('2d');
		  const image = ctx.createImageData(size, size);
		  Utils.qrToImageData(image.data, qrData, opts);

		  clearCanvas(ctx, canvasEl, size);
		  ctx.putImageData(image, 0, 0);

		  return canvasEl
		};

		exports$1.renderToDataURL = function renderToDataURL (qrData, canvas, options) {
		  let opts = options;

		  if (typeof opts === 'undefined' && (!canvas || !canvas.getContext)) {
		    opts = canvas;
		    canvas = undefined;
		  }

		  if (!opts) opts = {};

		  const canvasEl = exports$1.render(qrData, canvas, opts);

		  const type = opts.type || 'image/png';
		  const rendererOpts = opts.rendererOpts || {};

		  return canvasEl.toDataURL(type, rendererOpts.quality)
		}; 
	} (canvas));
	return canvas;
}

var svgTag = {};

var hasRequiredSvgTag;

function requireSvgTag () {
	if (hasRequiredSvgTag) return svgTag;
	hasRequiredSvgTag = 1;
	const Utils = requireUtils();

	function getColorAttrib (color, attrib) {
	  const alpha = color.a / 255;
	  const str = attrib + '="' + color.hex + '"';

	  return alpha < 1
	    ? str + ' ' + attrib + '-opacity="' + alpha.toFixed(2).slice(1) + '"'
	    : str
	}

	function svgCmd (cmd, x, y) {
	  let str = cmd + x;
	  if (typeof y !== 'undefined') str += ' ' + y;

	  return str
	}

	function qrToPath (data, size, margin) {
	  let path = '';
	  let moveBy = 0;
	  let newRow = false;
	  let lineLength = 0;

	  for (let i = 0; i < data.length; i++) {
	    const col = Math.floor(i % size);
	    const row = Math.floor(i / size);

	    if (!col && !newRow) newRow = true;

	    if (data[i]) {
	      lineLength++;

	      if (!(i > 0 && col > 0 && data[i - 1])) {
	        path += newRow
	          ? svgCmd('M', col + margin, 0.5 + row + margin)
	          : svgCmd('m', moveBy, 0);

	        moveBy = 0;
	        newRow = false;
	      }

	      if (!(col + 1 < size && data[i + 1])) {
	        path += svgCmd('h', lineLength);
	        lineLength = 0;
	      }
	    } else {
	      moveBy++;
	    }
	  }

	  return path
	}

	svgTag.render = function render (qrData, options, cb) {
	  const opts = Utils.getOptions(options);
	  const size = qrData.modules.size;
	  const data = qrData.modules.data;
	  const qrcodesize = size + opts.margin * 2;

	  const bg = !opts.color.light.a
	    ? ''
	    : '<path ' + getColorAttrib(opts.color.light, 'fill') +
	      ' d="M0 0h' + qrcodesize + 'v' + qrcodesize + 'H0z"/>';

	  const path =
	    '<path ' + getColorAttrib(opts.color.dark, 'stroke') +
	    ' d="' + qrToPath(data, size, opts.margin) + '"/>';

	  const viewBox = 'viewBox="' + '0 0 ' + qrcodesize + ' ' + qrcodesize + '"';

	  const width = !opts.width ? '' : 'width="' + opts.width + '" height="' + opts.width + '" ';

	  const svgTag = '<svg xmlns="http://www.w3.org/2000/svg" ' + width + viewBox + ' shape-rendering="crispEdges">' + bg + path + '</svg>\n';

	  if (typeof cb === 'function') {
	    cb(null, svgTag);
	  }

	  return svgTag
	};
	return svgTag;
}

var hasRequiredBrowser;

function requireBrowser () {
	if (hasRequiredBrowser) return browser;
	hasRequiredBrowser = 1;
	const canPromise = requireCanPromise();

	const QRCode = requireQrcode();
	const CanvasRenderer = requireCanvas();
	const SvgRenderer = requireSvgTag();

	function renderCanvas (renderFunc, canvas, text, opts, cb) {
	  const args = [].slice.call(arguments, 1);
	  const argsNum = args.length;
	  const isLastArgCb = typeof args[argsNum - 1] === 'function';

	  if (!isLastArgCb && !canPromise()) {
	    throw new Error('Callback required as last argument')
	  }

	  if (isLastArgCb) {
	    if (argsNum < 2) {
	      throw new Error('Too few arguments provided')
	    }

	    if (argsNum === 2) {
	      cb = text;
	      text = canvas;
	      canvas = opts = undefined;
	    } else if (argsNum === 3) {
	      if (canvas.getContext && typeof cb === 'undefined') {
	        cb = opts;
	        opts = undefined;
	      } else {
	        cb = opts;
	        opts = text;
	        text = canvas;
	        canvas = undefined;
	      }
	    }
	  } else {
	    if (argsNum < 1) {
	      throw new Error('Too few arguments provided')
	    }

	    if (argsNum === 1) {
	      text = canvas;
	      canvas = opts = undefined;
	    } else if (argsNum === 2 && !canvas.getContext) {
	      opts = text;
	      text = canvas;
	      canvas = undefined;
	    }

	    return new Promise(function (resolve, reject) {
	      try {
	        const data = QRCode.create(text, opts);
	        resolve(renderFunc(data, canvas, opts));
	      } catch (e) {
	        reject(e);
	      }
	    })
	  }

	  try {
	    const data = QRCode.create(text, opts);
	    cb(null, renderFunc(data, canvas, opts));
	  } catch (e) {
	    cb(e);
	  }
	}

	browser.create = QRCode.create;
	browser.toCanvas = renderCanvas.bind(null, CanvasRenderer.render);
	browser.toDataURL = renderCanvas.bind(null, CanvasRenderer.renderToDataURL);

	// only svg for now.
	browser.toString = renderCanvas.bind(null, function (data, _, opts) {
	  return SvgRenderer.render(data, opts)
	});
	return browser;
}

var browserExports = requireBrowser();
var QRCode = /*@__PURE__*/getDefaultExportFromCjs(browserExports);

async function encode(data) {
	return encodeStrict(data);
}
async function decode(data) {
	return jsDecode(data);
}

/*
    & ╔───────────────────────────────────────╗
    & │     ██╗   ██╗██╗ █████╗ ████████╗     │
    & │     ██║   ██║██║██╔══██╗╚══██╔══╝     │
    & │     ██║   ██║██║███████║   ██║        │
    & │     ╚██╗ ██╔╝██║██╔══██║   ██║        │
    & │      ╚████╔╝ ██║██║  ██║   ██║        │
    & │       ╚═══╝  ╚═╝╚═╝  ╚═╝   ╚═╝        │
    & │     █████████████████████████████     │
    & ╚───────────────────────────────────────╝
    ? █████████████████████████████████████████
    ! VIAT is a post quantum cryptocurrency designed for indefinite scalability and security.
    ! VIAT utilizes a novel blockchain architecture and quantum-resistant cryptographic algorithms to ensure the integrity and longevity of the network.
    ! WEBSITE: https://viat.network https://viat.network
    ^ HASH ALGORITHM: SHAKE256
    ^ SIGNATURE ALGORITHMS: ED25519, DILITHIUM, SPHINCS+
    * KEY EXCHANGE ALGORITHMS: X25519, Kyber
    * AEAD ENCRYPTION: AEGIS-256, XChaCha20-Poly1305
    * ADDRESS SIZES: Legacy (24 bytes), Hybrid-Quantum (32 bytes), Quantum (40, 48, 56, 64 bytes)
    * ENCODING: CBOR
    * NETWORK PROTOCOL: UW:// → UDSP:// → UDP
    * WEB: UNIVERSAL WEB
*/
/*
    ! READ ME
    ~ VIAT CONFIG FILE FOR DEFAULT CONSTANTS AND SETTINGS
    ~ ANY CHANGES HERE ARE REFLECTED THROUGHOUT THE CODEBASE
    ~ ANY VALUES THAT ARE SYSTEMIC SHOULD BE LISTED HERE
*/
/*
    ██╗███╗   ███╗██████╗  ██████╗ ██████╗ ████████╗███████╗
    ██║████╗ ████║██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝
    ██║██╔████╔██║██████╔╝██║   ██║██████╔╝   ██║   ███████╗
    ██║██║╚██╔╝██║██╔═══╝ ██║   ██║██╔══██╗   ██║   ╚════██║
    ██║██║ ╚═╝ ██║██║     ╚██████╔╝██║  ██║   ██║   ███████║
    ╚═╝╚═╝     ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝
*/
/*
! ██╗   ██╗██╗ █████╗ ████████╗    ██╗███╗   ██╗███████╗ ██████╗
! ██║   ██║██║██╔══██╗╚══██╔══╝    ██║████╗  ██║██╔════╝██╔═══██╗
! ██║   ██║██║███████║   ██║       ██║██╔██╗ ██║█████╗  ██║   ██║
! ╚██╗ ██╔╝██║██╔══██║   ██║       ██║██║╚██╗██║██╔══╝  ██║   ██║
!  ╚████╔╝ ██║██║  ██║   ██║       ██║██║ ╚████║██║     ╚██████╔╝
!   ╚═══╝  ╚═╝╚═╝  ╚═╝   ╚═╝       ╚═╝╚═╝  ╚═══╝╚═╝      ╚═════╝
*/
const VERSION = '0.0.1';
const COIN_NAME = 'VIAT';
const COIN_SYMBOL = '⩝';
// credits kreds units microns micros vits
const COIN_SMALLEST_UNIT_NAME = 'UNITS';
const COIN_LARGEST_UNIT_NAME = 'VIAT';
const COIN_TICKER = 'VIAT';
const COIN_ELEMENT_NAME = 'Vitainium';
const COIN_ELEMENT_SYMBOL = 'Vi';
/*
    * ███╗   ██╗██╗   ██╗███╗   ███╗██████╗ ███████╗██████╗ ███████╗
    * ████╗  ██║██║   ██║████╗ ████║██╔══██╗██╔════╝██╔══██╗██╔════╝
    * ██╔██╗ ██║██║   ██║██╔████╔██║██████╔╝█████╗  ██████╔╝███████╗
    * ██║╚██╗██║██║   ██║██║╚██╔╝██║██╔══██╗██╔══╝  ██╔══██╗╚════██║
    * ██║ ╚████║╚██████╔╝██║ ╚═╝ ██║██████╔╝███████╗██║  ██║███████║
    * ╚═╝  ╚═══╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝
*/
// Used for -> for micro payments, nano transactions, quantum payments (ultra-fine granularity transactions), High-Frequency Trading Fees, Low-Value Use Cases, Layer-2 or Batching, Counterparty Compatibility, atomic swaps, Viat Reserve Deflationary Mechanism
//  DECIMAL DRAFT AMOUNT
// 32 40 48 56
const COIN_DECIMAL_PLACES = 48;
const COIN_MAX_SUPPLY_DISPLAY = '10,000,000,000';
const COIN_MAX_WHOLE_SUPPLY_STRING = COIN_MAX_SUPPLY_DISPLAY.replace(/,/g, '');
const COIN_ZEROS = ''.padEnd(COIN_DECIMAL_PLACES, '0');
const COIN_MAX_SUPPLY_STRING = `${COIN_MAX_WHOLE_SUPPLY_STRING}${COIN_ZEROS}`;
const COIN_MAX_SUPPLY_ALL_STRING = `${COIN_MAX_SUPPLY_DISPLAY}.${COIN_ZEROS}`;
const COIN_MAX_SUPPLY = BigInt(COIN_MAX_SUPPLY_STRING);
const INITIAL_PRE_ALLOCATION_NUMBER = 4_200_000;
BigInt(`${INITIAL_PRE_ALLOCATION_NUMBER}${COIN_ZEROS}`);
const WALLETS = {
	LEGACY: {
		// 20 or 24 bytes is typical for non-quantum addresses
		// 20 could still be considered for smaller simple use cases
		WALLET_SIZE: 24}};
/*
^ ███████╗██╗  ██╗██████╗  ██████╗ ██████╗ ████████╗
^ ██╔════╝╚██╗██╔╝██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝
^ █████╗   ╚███╔╝ ██████╔╝██║   ██║██████╔╝   ██║
^ ██╔══╝   ██╔██╗ ██╔═══╝ ██║   ██║██╔══██╗   ██║
^ ███████╗██╔╝ ██╗██║     ╚██████╔╝██║  ██║   ██║
^ ╚══════╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝
*/
const VIAT_DEFAULTS = {
	WALLETS};
// console.log(VIAT_DEFAULTS);
console.log(`
╔──────────────────⩝────────────────────╗
│     ██╗     ██╗ ██╗ █████╗ ████████╗  │
│     ██║     ██║ ██║██╔══██╗╚══██╔══╝  │
│     ██║     ██║ ██║███████║   ██║     │
│     ╚██╗   ██╔╝ ██║██╔══██║   ██║     │
│      ╚██████╔╝  ██║██║  ██║   ██║     │
│       ╚═════╝   ╚═╝╚═╝  ╚═╝   ╚═╝     │
╚────────────MADE IN AMERICA────────────╝
NAME: ${COIN_NAME}
TICKER: ${COIN_TICKER}
SYMBOL: ${COIN_SYMBOL}
VERSION: ${VERSION}${COIN_SYMBOL}
SMALLEST UNIT NAME: ${COIN_SMALLEST_UNIT_NAME}
LARGEST UNIT NAME: ${COIN_LARGEST_UNIT_NAME}
ELEMENT NAME: ${COIN_ELEMENT_NAME} (${COIN_ELEMENT_SYMBOL})

 ████████╗ ██████╗ ██╗  ██╗███████╗███╗   ██╗ ██████╗ ███╗   ███╗██╗ ██████╗███████╗
 ╚══██╔══╝██╔═══██╗██║ ██╔╝██╔════╝████╗  ██║██╔═══██╗████╗ ████║██║██╔════╝██╔════╝
    ██║   ██║   ██║█████╔╝ █████╗  ██╔██╗ ██║██║   ██║██╔████╔██║██║██║     ███████╗
    ██║   ██║   ██║██╔═██╗ ██╔══╝  ██║╚██╗██║██║   ██║██║╚██╔╝██║██║██║     ╚════██║
    ██║   ╚██████╔╝██║  ██╗███████╗██║ ╚████║╚██████╔╝██║ ╚═╝ ██║██║╚██████╗███████║
    ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝     ╚═╝╚═╝ ╚═════╝╚══════╝
                                                                                   
MAX SUPPLY: ${COIN_MAX_SUPPLY_ALL_STRING} ${COIN_SYMBOL}
DECIMAL PLACES: ${COIN_DECIMAL_PLACES}
MAX SUPPLY INT: ${COIN_MAX_SUPPLY}
INITIAL PRE-ALLOCATION: ${INITIAL_PRE_ALLOCATION_NUMBER.toLocaleString()} ${COIN_SYMBOL}
`);
/*
! ███╗   ███╗ █████╗ ██████╗ ███████╗    ██╗███╗   ██╗
  ████╗ ████║██╔══██╗██╔══██╗██╔════╝    ██║████╗  ██║
? ██╔████╔██║███████║██║  ██║█████╗      ██║██╔██╗ ██║
! ██║╚██╔╝██║██╔══██║██║  ██║██╔══╝      ██║██║╚██╗██║
  ██║ ╚═╝ ██║██║  ██║██████╔╝███████╗    ██║██║ ╚████║
? ╚═╝     ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝    ╚═╝╚═╝  ╚═══╝
! ██╗   ██╗   ███████╗    █████╗
  ██║   ██║   ██╔════╝   ██╔══██╗
? ██║   ██║   ███████╗   ███████║
! ██║   ██║   ╚════██║   ██╔══██║
  ╚██████╔╝██╗███████║██╗██║  ██║██╗
?  ╚═════╝ ╚═╝╚══════╝╚═╝╚═╝  ╚═╝╚═╝
*/

const hashConfig = {
	dkLen: VIAT_DEFAULTS.WALLETS.LEGACY.WALLET_SIZE,
};
// TODO: Switch from buffers to native Uint8Arrays and ArrayBuffers for better performance and compatibility with Web APIs
async function generateLegacyAddress(publicKey, trapdoor) {
	const publicKeyBuffer = (isBuffer$1(publicKey)) ? publicKey : bufferExports.Buffer.from(publicKey);
	const trapdoorBuffer = (isBuffer$1(trapdoor)) ? trapdoor : bufferExports.Buffer.from(trapdoor);
	const concat = bufferExports.Buffer.concat([publicKeyBuffer, trapdoorBuffer]);
	return shake256(concat, hashConfig);
}
// example();

const textEncoder$1 = new TextEncoder();
const textDecoder = new TextDecoder();
function ensureBase64(source) {
	if (source && isString(source)) {
		return source;
	}
	return bufferExports.Buffer.from(source).toString('base64');
}
function textToBuffer(source) {
	return textEncoder$1.encode(source);
}
function toUint8Array(source) {
	if (source === undefined || source === null) {
		return new Uint8Array(0);
	}
	if (source instanceof Uint8Array) {
		return new Uint8Array(source);
	}
	if (source instanceof ArrayBuffer) {
		return new Uint8Array(source);
	}
	if (ArrayBuffer.isView(source)) {
		return new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
	}
	if (isString(source)) {
		return textToBuffer(source);
	}
	return new Uint8Array(bufferExports.Buffer.from(source));
}
function toBuffer(source) {
	return bufferExports.Buffer.from(toUint8Array(source));
}
function toBase64(source) {
	return bufferExports.Buffer.from(toUint8Array(source)).toString('base64');
}
function fromBase64(source) {
	return new Uint8Array(bufferExports.Buffer.from(source, 'base64'));
}
function decodeText(source) {
	return textDecoder.decode(toUint8Array(source));
}
function isBlobLike(source) {
	return typeof Blob !== 'undefined' && source instanceof Blob;
}

/*!
 * hash-wasm (https://www.npmjs.com/package/hash-wasm)
 * (c) Dani Biro
 * @license MIT
 */


/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

class Mutex {
    constructor() {
        this.mutex = Promise.resolve();
    }
    lock() {
        let begin = () => { };
        this.mutex = this.mutex.then(() => new Promise(begin));
        return new Promise((res) => {
            begin = res;
        });
    }
    dispatch(fn) {
        return __awaiter(this, void 0, void 0, function* () {
            const unlock = yield this.lock();
            try {
                return yield Promise.resolve(fn());
            }
            finally {
                unlock();
            }
        });
    }
}

var _a;
function getGlobal() {
    if (typeof globalThis !== "undefined")
        return globalThis;
    if (typeof self !== "undefined")
        return self;
    if (typeof window !== "undefined")
        return window;
    return global;
}
const globalObject = getGlobal();
const nodeBuffer = (_a = globalObject.Buffer) !== null && _a !== void 0 ? _a : null;
const textEncoder = globalObject.TextEncoder
    ? new globalObject.TextEncoder()
    : null;
function hexCharCodesToInt(a, b) {
    return ((((a & 0xf) + ((a >> 6) | ((a >> 3) & 0x8))) << 4) |
        ((b & 0xf) + ((b >> 6) | ((b >> 3) & 0x8))));
}
function writeHexToUInt8(buf, str) {
    const size = str.length >> 1;
    for (let i = 0; i < size; i++) {
        const index = i << 1;
        buf[i] = hexCharCodesToInt(str.charCodeAt(index), str.charCodeAt(index + 1));
    }
}
function hexStringEqualsUInt8(str, buf) {
    if (str.length !== buf.length * 2) {
        return false;
    }
    for (let i = 0; i < buf.length; i++) {
        const strIndex = i << 1;
        if (buf[i] !==
            hexCharCodesToInt(str.charCodeAt(strIndex), str.charCodeAt(strIndex + 1))) {
            return false;
        }
    }
    return true;
}
const alpha = "a".charCodeAt(0) - 10;
const digit = "0".charCodeAt(0);
function getDigestHex(tmpBuffer, input, hashLength) {
    let p = 0;
    for (let i = 0; i < hashLength; i++) {
        let nibble = input[i] >>> 4;
        tmpBuffer[p++] = nibble > 9 ? nibble + alpha : nibble + digit;
        nibble = input[i] & 0xf;
        tmpBuffer[p++] = nibble > 9 ? nibble + alpha : nibble + digit;
    }
    return String.fromCharCode.apply(null, tmpBuffer);
}
const getUInt8Buffer = nodeBuffer !== null
    ? (data) => {
        if (typeof data === "string") {
            const buf = nodeBuffer.from(data, "utf8");
            return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
        }
        if (nodeBuffer.isBuffer(data)) {
            return new Uint8Array(data.buffer, data.byteOffset, data.length);
        }
        if (ArrayBuffer.isView(data)) {
            return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        }
        throw new Error("Invalid data type!");
    }
    : (data) => {
        if (typeof data === "string") {
            return textEncoder.encode(data);
        }
        if (ArrayBuffer.isView(data)) {
            return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        }
        throw new Error("Invalid data type!");
    };
const base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const base64Lookup = new Uint8Array(256);
for (let i = 0; i < base64Chars.length; i++) {
    base64Lookup[base64Chars.charCodeAt(i)] = i;
}
function encodeBase64(data, pad = true) {
    const len = data.length;
    const extraBytes = len % 3;
    const parts = [];
    const len2 = len - extraBytes;
    for (let i = 0; i < len2; i += 3) {
        const tmp = ((data[i] << 16) & 0xff0000) +
            ((data[i + 1] << 8) & 0xff00) +
            (data[i + 2] & 0xff);
        const triplet = base64Chars.charAt((tmp >> 18) & 0x3f) +
            base64Chars.charAt((tmp >> 12) & 0x3f) +
            base64Chars.charAt((tmp >> 6) & 0x3f) +
            base64Chars.charAt(tmp & 0x3f);
        parts.push(triplet);
    }
    if (extraBytes === 1) {
        const tmp = data[len - 1];
        const a = base64Chars.charAt(tmp >> 2);
        const b = base64Chars.charAt((tmp << 4) & 0x3f);
        parts.push(`${a}${b}`);
        if (pad) {
            parts.push("==");
        }
    }
    else if (extraBytes === 2) {
        const tmp = (data[len - 2] << 8) + data[len - 1];
        const a = base64Chars.charAt(tmp >> 10);
        const b = base64Chars.charAt((tmp >> 4) & 0x3f);
        const c = base64Chars.charAt((tmp << 2) & 0x3f);
        parts.push(`${a}${b}${c}`);
        if (pad) {
            parts.push("=");
        }
    }
    return parts.join("");
}
function getDecodeBase64Length(data) {
    let bufferLength = Math.floor(data.length * 0.75);
    const len = data.length;
    if (data[len - 1] === "=") {
        bufferLength -= 1;
        if (data[len - 2] === "=") {
            bufferLength -= 1;
        }
    }
    return bufferLength;
}
function decodeBase64(data) {
    const bufferLength = getDecodeBase64Length(data);
    const len = data.length;
    const bytes = new Uint8Array(bufferLength);
    let p = 0;
    for (let i = 0; i < len; i += 4) {
        const encoded1 = base64Lookup[data.charCodeAt(i)];
        const encoded2 = base64Lookup[data.charCodeAt(i + 1)];
        const encoded3 = base64Lookup[data.charCodeAt(i + 2)];
        const encoded4 = base64Lookup[data.charCodeAt(i + 3)];
        bytes[p] = (encoded1 << 2) | (encoded2 >> 4);
        p += 1;
        bytes[p] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        p += 1;
        bytes[p] = ((encoded3 & 3) << 6) | (encoded4 & 63);
        p += 1;
    }
    return bytes;
}

const MAX_HEAP = 16 * 1024;
const WASM_FUNC_HASH_LENGTH = 4;
const wasmMutex = new Mutex();
const wasmModuleCache = new Map();
function WASMInterface(binary, hashLength) {
    return __awaiter(this, void 0, void 0, function* () {
        let wasmInstance = null;
        let memoryView = null;
        let initialized = false;
        if (typeof WebAssembly === "undefined") {
            throw new Error("WebAssembly is not supported in this environment!");
        }
        const writeMemory = (data, offset = 0) => {
            memoryView.set(data, offset);
        };
        const getMemory = () => memoryView;
        const getExports = () => wasmInstance.exports;
        const setMemorySize = (totalSize) => {
            wasmInstance.exports.Hash_SetMemorySize(totalSize);
            const arrayOffset = wasmInstance.exports.Hash_GetBuffer();
            const memoryBuffer = wasmInstance.exports.memory.buffer;
            memoryView = new Uint8Array(memoryBuffer, arrayOffset, totalSize);
        };
        const getStateSize = () => {
            const view = new DataView(wasmInstance.exports.memory.buffer);
            const stateSize = view.getUint32(wasmInstance.exports.STATE_SIZE, true);
            return stateSize;
        };
        const loadWASMPromise = wasmMutex.dispatch(() => __awaiter(this, void 0, void 0, function* () {
            if (!wasmModuleCache.has(binary.name)) {
                const asm = decodeBase64(binary.data);
                const promise = WebAssembly.compile(asm);
                wasmModuleCache.set(binary.name, promise);
            }
            const module = yield wasmModuleCache.get(binary.name);
            wasmInstance = yield WebAssembly.instantiate(module, {
            // env: {
            //   emscripten_memcpy_big: (dest, src, num) => {
            //     const memoryBuffer = wasmInstance.exports.memory.buffer;
            //     const memView = new Uint8Array(memoryBuffer, 0);
            //     memView.set(memView.subarray(src, src + num), dest);
            //   },
            //   print_memory: (offset, len) => {
            //     const memoryBuffer = wasmInstance.exports.memory.buffer;
            //     const memView = new Uint8Array(memoryBuffer, 0);
            //     console.log('print_int32', memView.subarray(offset, offset + len));
            //   },
            // },
            });
            // wasmInstance.exports._start();
        }));
        const setupInterface = () => __awaiter(this, void 0, void 0, function* () {
            if (!wasmInstance) {
                yield loadWASMPromise;
            }
            const arrayOffset = wasmInstance.exports.Hash_GetBuffer();
            const memoryBuffer = wasmInstance.exports.memory.buffer;
            memoryView = new Uint8Array(memoryBuffer, arrayOffset, MAX_HEAP);
        });
        const init = (bits = null) => {
            initialized = true;
            wasmInstance.exports.Hash_Init(bits);
        };
        const updateUInt8Array = (data) => {
            let read = 0;
            while (read < data.length) {
                const chunk = data.subarray(read, read + MAX_HEAP);
                read += chunk.length;
                memoryView.set(chunk);
                wasmInstance.exports.Hash_Update(chunk.length);
            }
        };
        const update = (data) => {
            if (!initialized) {
                throw new Error("update() called before init()");
            }
            const Uint8Buffer = getUInt8Buffer(data);
            updateUInt8Array(Uint8Buffer);
        };
        const digestChars = new Uint8Array(hashLength * 2);
        const digest = (outputType, padding = null) => {
            if (!initialized) {
                throw new Error("digest() called before init()");
            }
            initialized = false;
            wasmInstance.exports.Hash_Final(padding);
            if (outputType === "binary") {
                // the data is copied to allow GC of the original memory object
                return memoryView.slice(0, hashLength);
            }
            return getDigestHex(digestChars, memoryView, hashLength);
        };
        const save = () => {
            if (!initialized) {
                throw new Error("save() can only be called after init() and before digest()");
            }
            const stateOffset = wasmInstance.exports.Hash_GetState();
            const stateLength = getStateSize();
            const memoryBuffer = wasmInstance.exports.memory.buffer;
            const internalState = new Uint8Array(memoryBuffer, stateOffset, stateLength);
            // prefix is 4 bytes from SHA1 hash of the WASM binary
            // it is used to detect incompatible internal states between different versions of hash-wasm
            const prefixedState = new Uint8Array(WASM_FUNC_HASH_LENGTH + stateLength);
            writeHexToUInt8(prefixedState, binary.hash);
            prefixedState.set(internalState, WASM_FUNC_HASH_LENGTH);
            return prefixedState;
        };
        const load = (state) => {
            if (!(state instanceof Uint8Array)) {
                throw new Error("load() expects an Uint8Array generated by save()");
            }
            const stateOffset = wasmInstance.exports.Hash_GetState();
            const stateLength = getStateSize();
            const overallLength = WASM_FUNC_HASH_LENGTH + stateLength;
            const memoryBuffer = wasmInstance.exports.memory.buffer;
            if (state.length !== overallLength) {
                throw new Error(`Bad state length (expected ${overallLength} bytes, got ${state.length})`);
            }
            if (!hexStringEqualsUInt8(binary.hash, state.subarray(0, WASM_FUNC_HASH_LENGTH))) {
                throw new Error("This state was written by an incompatible hash implementation");
            }
            const internalState = state.subarray(WASM_FUNC_HASH_LENGTH);
            new Uint8Array(memoryBuffer, stateOffset, stateLength).set(internalState);
            initialized = true;
        };
        const isDataShort = (data) => {
            if (typeof data === "string") {
                // worst case is 4 bytes / char
                return data.length < MAX_HEAP / 4;
            }
            return data.byteLength < MAX_HEAP;
        };
        let canSimplify = isDataShort;
        switch (binary.name) {
            case "argon2":
            case "scrypt":
                canSimplify = () => true;
                break;
            case "blake2b":
            case "blake2s":
                // if there is a key at blake2 then cannot simplify
                canSimplify = (data, initParam) => initParam <= 512 && isDataShort(data);
                break;
            case "blake3":
                // if there is a key at blake3 then cannot simplify
                canSimplify = (data, initParam) => initParam === 0 && isDataShort(data);
                break;
            case "xxhash64": // cannot simplify
            case "xxhash3":
            case "xxhash128":
            case "crc64":
                canSimplify = () => false;
                break;
        }
        // shorthand for (init + update + digest) for better performance
        const calculate = (data, initParam = null, digestParam = null) => {
            if (!canSimplify(data, initParam)) {
                init(initParam);
                update(data);
                return digest("hex", digestParam);
            }
            const buffer = getUInt8Buffer(data);
            memoryView.set(buffer);
            wasmInstance.exports.Hash_Calculate(buffer.length, initParam, digestParam);
            return getDigestHex(digestChars, memoryView, hashLength);
        };
        yield setupInterface();
        return {
            getMemory,
            writeMemory,
            getExports,
            setMemorySize,
            init,
            update,
            digest,
            save,
            load,
            calculate,
            hashLength,
        };
    });
}

new Mutex();

var name$k = "argon2";
var data$k = "AGFzbQEAAAABKQVgAX8Bf2AAAX9gEH9/f39/f39/f39/f39/f38AYAR/f39/AGACf38AAwYFAAECAwQFBgEBAoCAAgYIAX8BQZCoBAsHQQQGbWVtb3J5AgASSGFzaF9TZXRNZW1vcnlTaXplAAAOSGFzaF9HZXRCdWZmZXIAAQ5IYXNoX0NhbGN1bGF0ZQAECvEyBVgBAn9BACEBAkAgAEEAKAKICCICRg0AAkAgACACayIAQRB2IABBgIB8cSAASWoiAEAAQX9HDQBB/wHADwtBACEBQQBBACkDiAggAEEQdK18NwOICAsgAcALcAECfwJAQQAoAoAIIgANAEEAPwBBEHQiADYCgAhBACgCiAgiAUGAgCBGDQACQEGAgCAgAWsiAEEQdiAAQYCAfHEgAElqIgBAAEF/Rw0AQQAPC0EAQQApA4gIIABBEHStfDcDiAhBACgCgAghAAsgAAvcDgECfiAAIAQpAwAiECAAKQMAIhF8IBFCAYZC/v///x+DIBBC/////w+DfnwiEDcDACAMIBAgDCkDAIVCIIkiEDcDACAIIBAgCCkDACIRfCARQgGGQv7///8fgyAQQv////8Pg358IhA3AwAgBCAQIAQpAwCFQiiJIhA3AwAgACAQIAApAwAiEXwgEEL/////D4MgEUIBhkL+////H4N+fCIQNwMAIAwgECAMKQMAhUIwiSIQNwMAIAggECAIKQMAIhF8IBBC/////w+DIBFCAYZC/v///x+DfnwiEDcDACAEIBAgBCkDAIVCAYk3AwAgASAFKQMAIhAgASkDACIRfCARQgGGQv7///8fgyAQQv////8Pg358IhA3AwAgDSAQIA0pAwCFQiCJIhA3AwAgCSAQIAkpAwAiEXwgEUIBhkL+////H4MgEEL/////D4N+fCIQNwMAIAUgECAFKQMAhUIoiSIQNwMAIAEgECABKQMAIhF8IBBC/////w+DIBFCAYZC/v///x+DfnwiEDcDACANIBAgDSkDAIVCMIkiEDcDACAJIBAgCSkDACIRfCAQQv////8PgyARQgGGQv7///8fg358IhA3AwAgBSAQIAUpAwCFQgGJNwMAIAIgBikDACIQIAIpAwAiEXwgEUIBhkL+////H4MgEEL/////D4N+fCIQNwMAIA4gECAOKQMAhUIgiSIQNwMAIAogECAKKQMAIhF8IBFCAYZC/v///x+DIBBC/////w+DfnwiEDcDACAGIBAgBikDAIVCKIkiEDcDACACIBAgAikDACIRfCAQQv////8PgyARQgGGQv7///8fg358IhA3AwAgDiAQIA4pAwCFQjCJIhA3AwAgCiAQIAopAwAiEXwgEEL/////D4MgEUIBhkL+////H4N+fCIQNwMAIAYgECAGKQMAhUIBiTcDACADIAcpAwAiECADKQMAIhF8IBFCAYZC/v///x+DIBBC/////w+DfnwiEDcDACAPIBAgDykDAIVCIIkiEDcDACALIBAgCykDACIRfCARQgGGQv7///8fgyAQQv////8Pg358IhA3AwAgByAQIAcpAwCFQiiJIhA3AwAgAyAQIAMpAwAiEXwgEEL/////D4MgEUIBhkL+////H4N+fCIQNwMAIA8gECAPKQMAhUIwiSIQNwMAIAsgECALKQMAIhF8IBBC/////w+DIBFCAYZC/v///x+DfnwiEDcDACAHIBAgBykDAIVCAYk3AwAgACAFKQMAIhAgACkDACIRfCARQgGGQv7///8fgyAQQv////8Pg358IhA3AwAgDyAQIA8pAwCFQiCJIhA3AwAgCiAQIAopAwAiEXwgEUIBhkL+////H4MgEEL/////D4N+fCIQNwMAIAUgECAFKQMAhUIoiSIQNwMAIAAgECAAKQMAIhF8IBBC/////w+DIBFCAYZC/v///x+DfnwiEDcDACAPIBAgDykDAIVCMIkiEDcDACAKIBAgCikDACIRfCAQQv////8PgyARQgGGQv7///8fg358IhA3AwAgBSAQIAUpAwCFQgGJNwMAIAEgBikDACIQIAEpAwAiEXwgEUIBhkL+////H4MgEEL/////D4N+fCIQNwMAIAwgECAMKQMAhUIgiSIQNwMAIAsgECALKQMAIhF8IBFCAYZC/v///x+DIBBC/////w+DfnwiEDcDACAGIBAgBikDAIVCKIkiEDcDACABIBAgASkDACIRfCAQQv////8PgyARQgGGQv7///8fg358IhA3AwAgDCAQIAwpAwCFQjCJIhA3AwAgCyAQIAspAwAiEXwgEEL/////D4MgEUIBhkL+////H4N+fCIQNwMAIAYgECAGKQMAhUIBiTcDACACIAcpAwAiECACKQMAIhF8IBFCAYZC/v///x+DIBBC/////w+DfnwiEDcDACANIBAgDSkDAIVCIIkiEDcDACAIIBAgCCkDACIRfCARQgGGQv7///8fgyAQQv////8Pg358IhA3AwAgByAQIAcpAwCFQiiJIhA3AwAgAiAQIAIpAwAiEXwgEEL/////D4MgEUIBhkL+////H4N+fCIQNwMAIA0gECANKQMAhUIwiSIQNwMAIAggECAIKQMAIhF8IBBC/////w+DIBFCAYZC/v///x+DfnwiEDcDACAHIBAgBykDAIVCAYk3AwAgAyAEKQMAIhAgAykDACIRfCARQgGGQv7///8fgyAQQv////8Pg358IhA3AwAgDiAQIA4pAwCFQiCJIhA3AwAgCSAQIAkpAwAiEXwgEUIBhkL+////H4MgEEL/////D4N+fCIQNwMAIAQgECAEKQMAhUIoiSIQNwMAIAMgECADKQMAIhF8IBBC/////w+DIBFCAYZC/v///x+DfnwiEDcDACAOIBAgDikDAIVCMIkiEDcDACAJIBAgCSkDACIRfCAQQv////8PgyARQgGGQv7///8fg358IhA3AwAgBCAQIAQpAwCFQgGJNwMAC98aAQN/QQAhBEEAIAIpAwAgASkDAIU3A5AIQQAgAikDCCABKQMIhTcDmAhBACACKQMQIAEpAxCFNwOgCEEAIAIpAxggASkDGIU3A6gIQQAgAikDICABKQMghTcDsAhBACACKQMoIAEpAyiFNwO4CEEAIAIpAzAgASkDMIU3A8AIQQAgAikDOCABKQM4hTcDyAhBACACKQNAIAEpA0CFNwPQCEEAIAIpA0ggASkDSIU3A9gIQQAgAikDUCABKQNQhTcD4AhBACACKQNYIAEpA1iFNwPoCEEAIAIpA2AgASkDYIU3A/AIQQAgAikDaCABKQNohTcD+AhBACACKQNwIAEpA3CFNwOACUEAIAIpA3ggASkDeIU3A4gJQQAgAikDgAEgASkDgAGFNwOQCUEAIAIpA4gBIAEpA4gBhTcDmAlBACACKQOQASABKQOQAYU3A6AJQQAgAikDmAEgASkDmAGFNwOoCUEAIAIpA6ABIAEpA6ABhTcDsAlBACACKQOoASABKQOoAYU3A7gJQQAgAikDsAEgASkDsAGFNwPACUEAIAIpA7gBIAEpA7gBhTcDyAlBACACKQPAASABKQPAAYU3A9AJQQAgAikDyAEgASkDyAGFNwPYCUEAIAIpA9ABIAEpA9ABhTcD4AlBACACKQPYASABKQPYAYU3A+gJQQAgAikD4AEgASkD4AGFNwPwCUEAIAIpA+gBIAEpA+gBhTcD+AlBACACKQPwASABKQPwAYU3A4AKQQAgAikD+AEgASkD+AGFNwOICkEAIAIpA4ACIAEpA4AChTcDkApBACACKQOIAiABKQOIAoU3A5gKQQAgAikDkAIgASkDkAKFNwOgCkEAIAIpA5gCIAEpA5gChTcDqApBACACKQOgAiABKQOgAoU3A7AKQQAgAikDqAIgASkDqAKFNwO4CkEAIAIpA7ACIAEpA7AChTcDwApBACACKQO4AiABKQO4AoU3A8gKQQAgAikDwAIgASkDwAKFNwPQCkEAIAIpA8gCIAEpA8gChTcD2ApBACACKQPQAiABKQPQAoU3A+AKQQAgAikD2AIgASkD2AKFNwPoCkEAIAIpA+ACIAEpA+AChTcD8ApBACACKQPoAiABKQPoAoU3A/gKQQAgAikD8AIgASkD8AKFNwOAC0EAIAIpA/gCIAEpA/gChTcDiAtBACACKQOAAyABKQOAA4U3A5ALQQAgAikDiAMgASkDiAOFNwOYC0EAIAIpA5ADIAEpA5ADhTcDoAtBACACKQOYAyABKQOYA4U3A6gLQQAgAikDoAMgASkDoAOFNwOwC0EAIAIpA6gDIAEpA6gDhTcDuAtBACACKQOwAyABKQOwA4U3A8ALQQAgAikDuAMgASkDuAOFNwPIC0EAIAIpA8ADIAEpA8ADhTcD0AtBACACKQPIAyABKQPIA4U3A9gLQQAgAikD0AMgASkD0AOFNwPgC0EAIAIpA9gDIAEpA9gDhTcD6AtBACACKQPgAyABKQPgA4U3A/ALQQAgAikD6AMgASkD6AOFNwP4C0EAIAIpA/ADIAEpA/ADhTcDgAxBACACKQP4AyABKQP4A4U3A4gMQQAgAikDgAQgASkDgASFNwOQDEEAIAIpA4gEIAEpA4gEhTcDmAxBACACKQOQBCABKQOQBIU3A6AMQQAgAikDmAQgASkDmASFNwOoDEEAIAIpA6AEIAEpA6AEhTcDsAxBACACKQOoBCABKQOoBIU3A7gMQQAgAikDsAQgASkDsASFNwPADEEAIAIpA7gEIAEpA7gEhTcDyAxBACACKQPABCABKQPABIU3A9AMQQAgAikDyAQgASkDyASFNwPYDEEAIAIpA9AEIAEpA9AEhTcD4AxBACACKQPYBCABKQPYBIU3A+gMQQAgAikD4AQgASkD4ASFNwPwDEEAIAIpA+gEIAEpA+gEhTcD+AxBACACKQPwBCABKQPwBIU3A4ANQQAgAikD+AQgASkD+ASFNwOIDUEAIAIpA4AFIAEpA4AFhTcDkA1BACACKQOIBSABKQOIBYU3A5gNQQAgAikDkAUgASkDkAWFNwOgDUEAIAIpA5gFIAEpA5gFhTcDqA1BACACKQOgBSABKQOgBYU3A7ANQQAgAikDqAUgASkDqAWFNwO4DUEAIAIpA7AFIAEpA7AFhTcDwA1BACACKQO4BSABKQO4BYU3A8gNQQAgAikDwAUgASkDwAWFNwPQDUEAIAIpA8gFIAEpA8gFhTcD2A1BACACKQPQBSABKQPQBYU3A+ANQQAgAikD2AUgASkD2AWFNwPoDUEAIAIpA+AFIAEpA+AFhTcD8A1BACACKQPoBSABKQPoBYU3A/gNQQAgAikD8AUgASkD8AWFNwOADkEAIAIpA/gFIAEpA/gFhTcDiA5BACACKQOABiABKQOABoU3A5AOQQAgAikDiAYgASkDiAaFNwOYDkEAIAIpA5AGIAEpA5AGhTcDoA5BACACKQOYBiABKQOYBoU3A6gOQQAgAikDoAYgASkDoAaFNwOwDkEAIAIpA6gGIAEpA6gGhTcDuA5BACACKQOwBiABKQOwBoU3A8AOQQAgAikDuAYgASkDuAaFNwPIDkEAIAIpA8AGIAEpA8AGhTcD0A5BACACKQPIBiABKQPIBoU3A9gOQQAgAikD0AYgASkD0AaFNwPgDkEAIAIpA9gGIAEpA9gGhTcD6A5BACACKQPgBiABKQPgBoU3A/AOQQAgAikD6AYgASkD6AaFNwP4DkEAIAIpA/AGIAEpA/AGhTcDgA9BACACKQP4BiABKQP4BoU3A4gPQQAgAikDgAcgASkDgAeFNwOQD0EAIAIpA4gHIAEpA4gHhTcDmA9BACACKQOQByABKQOQB4U3A6APQQAgAikDmAcgASkDmAeFNwOoD0EAIAIpA6AHIAEpA6AHhTcDsA9BACACKQOoByABKQOoB4U3A7gPQQAgAikDsAcgASkDsAeFNwPAD0EAIAIpA7gHIAEpA7gHhTcDyA9BACACKQPAByABKQPAB4U3A9APQQAgAikDyAcgASkDyAeFNwPYD0EAIAIpA9AHIAEpA9AHhTcD4A9BACACKQPYByABKQPYB4U3A+gPQQAgAikD4AcgASkD4AeFNwPwD0EAIAIpA+gHIAEpA+gHhTcD+A9BACACKQPwByABKQPwB4U3A4AQQQAgAikD+AcgASkD+AeFNwOIEEGQCEGYCEGgCEGoCEGwCEG4CEHACEHICEHQCEHYCEHgCEHoCEHwCEH4CEGACUGICRACQZAJQZgJQaAJQagJQbAJQbgJQcAJQcgJQdAJQdgJQeAJQegJQfAJQfgJQYAKQYgKEAJBkApBmApBoApBqApBsApBuApBwApByApB0ApB2ApB4ApB6ApB8ApB+ApBgAtBiAsQAkGQC0GYC0GgC0GoC0GwC0G4C0HAC0HIC0HQC0HYC0HgC0HoC0HwC0H4C0GADEGIDBACQZAMQZgMQaAMQagMQbAMQbgMQcAMQcgMQdAMQdgMQeAMQegMQfAMQfgMQYANQYgNEAJBkA1BmA1BoA1BqA1BsA1BuA1BwA1ByA1B0A1B2A1B4A1B6A1B8A1B+A1BgA5BiA4QAkGQDkGYDkGgDkGoDkGwDkG4DkHADkHIDkHQDkHYDkHgDkHoDkHwDkH4DkGAD0GIDxACQZAPQZgPQaAPQagPQbAPQbgPQcAPQcgPQdAPQdgPQeAPQegPQfAPQfgPQYAQQYgQEAJBkAhBmAhBkAlBmAlBkApBmApBkAtBmAtBkAxBmAxBkA1BmA1BkA5BmA5BkA9BmA8QAkGgCEGoCEGgCUGoCUGgCkGoCkGgC0GoC0GgDEGoDEGgDUGoDUGgDkGoDkGgD0GoDxACQbAIQbgIQbAJQbgJQbAKQbgKQbALQbgLQbAMQbgMQbANQbgNQbAOQbgOQbAPQbgPEAJBwAhByAhBwAlByAlBwApByApBwAtByAtBwAxByAxBwA1ByA1BwA5ByA5BwA9ByA8QAkHQCEHYCEHQCUHYCUHQCkHYCkHQC0HYC0HQDEHYDEHQDUHYDUHQDkHYDkHQD0HYDxACQeAIQegIQeAJQegJQeAKQegKQeALQegLQeAMQegMQeANQegNQeAOQegOQeAPQegPEAJB8AhB+AhB8AlB+AlB8ApB+ApB8AtB+AtB8AxB+AxB8A1B+A1B8A5B+A5B8A9B+A8QAkGACUGICUGACkGICkGAC0GIC0GADEGIDEGADUGIDUGADkGIDkGAD0GID0GAEEGIEBACAkACQCADRQ0AA0AgACAEaiIDIAIgBGoiBSkDACABIARqIgYpAwCFIARBkAhqKQMAhSADKQMAhTcDACADQQhqIgMgBUEIaikDACAGQQhqKQMAhSAEQZgIaikDAIUgAykDAIU3AwAgBEEQaiIEQYAIRw0ADAILC0EAIQQDQCAAIARqIgMgAiAEaiIFKQMAIAEgBGoiBikDAIUgBEGQCGopAwCFNwMAIANBCGogBUEIaikDACAGQQhqKQMAhSAEQZgIaikDAIU3AwAgBEEQaiIEQYAIRw0ACwsL5QcMBX8BfgR/An4BfwF+AX8Bfgd/AX4DfwF+AkBBACgCgAgiAiABQQp0aiIDKAIIIAFHDQAgAygCDCEEIAMoAgAhBUEAIAMoAhQiBq03A7gQQQAgBK0iBzcDsBBBACAFIAEgBUECdG4iCGwiCUECdK03A6gQAkACQAJAAkAgBEUNAEF/IQogBUUNASAIQQNsIQsgCEECdCIErSEMIAWtIQ0gBkF/akECSSEOQgAhDwNAQQAgDzcDkBAgD6chEEIAIRFBACEBA0BBACARNwOgECAPIBGEUCIDIA5xIRIgBkEBRiAPUCITIAZBAkYgEUICVHFxciEUQX8gAUEBakEDcSAIbEF/aiATGyEVIAEgEHIhFiABIAhsIRcgA0EBdCEYQgAhGQNAQQBCADcDwBBBACAZNwOYECAYIQECQCASRQ0AQQBCATcDwBBBkBhBkBBBkCBBABADQZAYQZAYQZAgQQAQA0ECIQELAkAgASAITw0AIAQgGaciGmwgF2ogAWohAwNAIANBACAEIAEbQQAgEVAiGxtqQX9qIRwCQAJAIBQNAEEAKAKACCICIBxBCnQiHGohCgwBCwJAIAFB/wBxIgINAEEAQQApA8AQQgF8NwPAEEGQGEGQEEGQIEEAEANBkBhBkBhBkCBBABADCyAcQQp0IRwgAkEDdEGQGGohCkEAKAKACCECCyACIANBCnRqIAIgHGogAiAKKQMAIh1CIIinIAVwIBogFhsiHCAEbCABIAFBACAZIBytUSIcGyIKIBsbIBdqIAogC2ogExsgAUUgHHJrIhsgFWqtIB1C/////w+DIh0gHX5CIIggG61+QiCIfSAMgqdqQQp0akEBEAMgA0EBaiEDIAggAUEBaiIBRw0ACwsgGUIBfCIZIA1SDQALIBFCAXwiEachASARQgRSDQALIA9CAXwiDyAHUg0AC0EAKAKACCECCyAJQQx0QYB4aiEXIAVBf2oiCkUNAgwBC0EAQgM3A6AQQQAgBEF/aq03A5AQQYB4IRcLIAIgF2ohGyAIQQx0IQhBACEcA0AgCCAcQQFqIhxsQYB4aiEEQQAhAQNAIBsgAWoiAyADKQMAIAIgBCABamopAwCFNwMAIANBCGoiAyADKQMAIAIgBCABQQhyamopAwCFNwMAIAFBCGohAyABQRBqIQEgA0H4B0kNAAsgHCAKRw0ACwsgAiAXaiEbQXghAQNAIAIgAWoiA0EIaiAbIAFqIgRBCGopAwA3AwAgA0EQaiAEQRBqKQMANwMAIANBGGogBEEYaikDADcDACADQSBqIARBIGopAwA3AwAgAUEgaiIBQfgHSQ0ACwsL";
var hash$k = "e4cdc523";
var wasmJson$k = {
	name: name$k,
	data: data$k,
	hash: hash$k
};

var name$j = "blake2b";
var data$j = "AGFzbQEAAAABEQRgAAF/YAJ/fwBgAX8AYAAAAwoJAAECAwECAgABBQQBAQICBg4CfwFBsIsFC38AQYAICwdwCAZtZW1vcnkCAA5IYXNoX0dldEJ1ZmZlcgAACkhhc2hfRmluYWwAAwlIYXNoX0luaXQABQtIYXNoX1VwZGF0ZQAGDUhhc2hfR2V0U3RhdGUABw5IYXNoX0NhbGN1bGF0ZQAIClNUQVRFX1NJWkUDAQrTOAkFAEGACQvrAgIFfwF+AkAgAUEBSA0AAkACQAJAIAFBgAFBACgC4IoBIgJrIgNKDQAgASEEDAELQQBBADYC4IoBAkAgAkH/AEoNACACQeCJAWohBSAAIQRBACEGA0AgBSAELQAAOgAAIARBAWohBCAFQQFqIQUgAyAGQQFqIgZB/wFxSg0ACwtBAEEAKQPAiQEiB0KAAXw3A8CJAUEAQQApA8iJASAHQv9+Vq18NwPIiQFB4IkBEAIgACADaiEAAkAgASADayIEQYEBSA0AIAIgAWohBQNAQQBBACkDwIkBIgdCgAF8NwPAiQFBAEEAKQPIiQEgB0L/flatfDcDyIkBIAAQAiAAQYABaiEAIAVBgH9qIgVBgAJLDQALIAVBgH9qIQQMAQsgBEEATA0BC0EAIQUDQCAFQQAoAuCKAWpB4IkBaiAAIAVqLQAAOgAAIAQgBUEBaiIFQf8BcUoNAAsLQQBBACgC4IoBIARqNgLgigELC78uASR+QQBBACkD0IkBQQApA7CJASIBQQApA5CJAXwgACkDICICfCIDhULr+obav7X2wR+FQiCJIgRCq/DT9K/uvLc8fCIFIAGFQiiJIgYgA3wgACkDKCIBfCIHIASFQjCJIgggBXwiCSAGhUIBiSIKQQApA8iJAUEAKQOoiQEiBEEAKQOIiQF8IAApAxAiA3wiBYVCn9j52cKR2oKbf4VCIIkiC0K7zqqm2NDrs7t/fCIMIASFQiiJIg0gBXwgACkDGCIEfCIOfCAAKQNQIgV8Ig9BACkDwIkBQQApA6CJASIQQQApA4CJASIRfCAAKQMAIgZ8IhKFQtGFmu/6z5SH0QCFQiCJIhNCiJLznf/M+YTqAHwiFCAQhUIoiSIVIBJ8IAApAwgiEHwiFiAThUIwiSIXhUIgiSIYQQApA9iJAUEAKQO4iQEiE0EAKQOYiQF8IAApAzAiEnwiGYVC+cL4m5Gjs/DbAIVCIIkiGkLx7fT4paf9p6V/fCIbIBOFQiiJIhwgGXwgACkDOCITfCIZIBqFQjCJIhogG3wiG3wiHSAKhUIoiSIeIA98IAApA1giCnwiDyAYhUIwiSIYIB18Ih0gDiALhUIwiSIOIAx8Ih8gDYVCAYkiDCAWfCAAKQNAIgt8Ig0gGoVCIIkiFiAJfCIaIAyFQiiJIiAgDXwgACkDSCIJfCIhIBaFQjCJIhYgGyAchUIBiSIMIAd8IAApA2AiB3wiDSAOhUIgiSIOIBcgFHwiFHwiFyAMhUIoiSIbIA18IAApA2giDHwiHCAOhUIwiSIOIBd8IhcgG4VCAYkiGyAZIBQgFYVCAYkiFHwgACkDcCINfCIVIAiFQiCJIhkgH3wiHyAUhUIoiSIUIBV8IAApA3giCHwiFXwgDHwiIoVCIIkiI3wiJCAbhUIoiSIbICJ8IBJ8IiIgFyAYIBUgGYVCMIkiFSAffCIZIBSFQgGJIhQgIXwgDXwiH4VCIIkiGHwiFyAUhUIoiSIUIB98IAV8Ih8gGIVCMIkiGCAXfCIXIBSFQgGJIhR8IAF8IiEgFiAafCIWIBUgHSAehUIBiSIaIBx8IAl8IhyFQiCJIhV8Ih0gGoVCKIkiGiAcfCAIfCIcIBWFQjCJIhWFQiCJIh4gGSAOIBYgIIVCAYkiFiAPfCACfCIPhUIgiSIOfCIZIBaFQiiJIhYgD3wgC3wiDyAOhUIwiSIOIBl8Ihl8IiAgFIVCKIkiFCAhfCAEfCIhIB6FQjCJIh4gIHwiICAiICOFQjCJIiIgJHwiIyAbhUIBiSIbIBx8IAp8IhwgDoVCIIkiDiAXfCIXIBuFQiiJIhsgHHwgE3wiHCAOhUIwiSIOIBkgFoVCAYkiFiAffCAQfCIZICKFQiCJIh8gFSAdfCIVfCIdIBaFQiiJIhYgGXwgB3wiGSAfhUIwiSIfIB18Ih0gFoVCAYkiFiAVIBqFQgGJIhUgD3wgBnwiDyAYhUIgiSIYICN8IhogFYVCKIkiFSAPfCADfCIPfCAHfCIihUIgiSIjfCIkIBaFQiiJIhYgInwgBnwiIiAjhUIwiSIjICR8IiQgFoVCAYkiFiAOIBd8Ig4gDyAYhUIwiSIPICAgFIVCAYkiFCAZfCAKfCIXhUIgiSIYfCIZIBSFQiiJIhQgF3wgC3wiF3wgBXwiICAPIBp8Ig8gHyAOIBuFQgGJIg4gIXwgCHwiGoVCIIkiG3wiHyAOhUIoiSIOIBp8IAx8IhogG4VCMIkiG4VCIIkiISAdIB4gDyAVhUIBiSIPIBx8IAF8IhWFQiCJIhx8Ih0gD4VCKIkiDyAVfCADfCIVIByFQjCJIhwgHXwiHXwiHiAWhUIoiSIWICB8IA18IiAgIYVCMIkiISAefCIeIBogFyAYhUIwiSIXIBl8IhggFIVCAYkiFHwgCXwiGSAchUIgiSIaICR8IhwgFIVCKIkiFCAZfCACfCIZIBqFQjCJIhogHSAPhUIBiSIPICJ8IAR8Ih0gF4VCIIkiFyAbIB98Iht8Ih8gD4VCKIkiDyAdfCASfCIdIBeFQjCJIhcgH3wiHyAPhUIBiSIPIBsgDoVCAYkiDiAVfCATfCIVICOFQiCJIhsgGHwiGCAOhUIoiSIOIBV8IBB8IhV8IAx8IiKFQiCJIiN8IiQgD4VCKIkiDyAifCAHfCIiICOFQjCJIiMgJHwiJCAPhUIBiSIPIBogHHwiGiAVIBuFQjCJIhUgHiAWhUIBiSIWIB18IAR8IhuFQiCJIhx8Ih0gFoVCKIkiFiAbfCAQfCIbfCABfCIeIBUgGHwiFSAXIBogFIVCAYkiFCAgfCATfCIYhUIgiSIXfCIaIBSFQiiJIhQgGHwgCXwiGCAXhUIwiSIXhUIgiSIgIB8gISAVIA6FQgGJIg4gGXwgCnwiFYVCIIkiGXwiHyAOhUIoiSIOIBV8IA18IhUgGYVCMIkiGSAffCIffCIhIA+FQiiJIg8gHnwgBXwiHiAghUIwiSIgICF8IiEgGyAchUIwiSIbIB18IhwgFoVCAYkiFiAYfCADfCIYIBmFQiCJIhkgJHwiHSAWhUIoiSIWIBh8IBJ8IhggGYVCMIkiGSAfIA6FQgGJIg4gInwgAnwiHyAbhUIgiSIbIBcgGnwiF3wiGiAOhUIoiSIOIB98IAZ8Ih8gG4VCMIkiGyAafCIaIA6FQgGJIg4gFSAXIBSFQgGJIhR8IAh8IhUgI4VCIIkiFyAcfCIcIBSFQiiJIhQgFXwgC3wiFXwgBXwiIoVCIIkiI3wiJCAOhUIoiSIOICJ8IAh8IiIgGiAgIBUgF4VCMIkiFSAcfCIXIBSFQgGJIhQgGHwgCXwiGIVCIIkiHHwiGiAUhUIoiSIUIBh8IAZ8IhggHIVCMIkiHCAafCIaIBSFQgGJIhR8IAR8IiAgGSAdfCIZIBUgISAPhUIBiSIPIB98IAN8Ih2FQiCJIhV8Ih8gD4VCKIkiDyAdfCACfCIdIBWFQjCJIhWFQiCJIiEgFyAbIBkgFoVCAYkiFiAefCABfCIZhUIgiSIbfCIXIBaFQiiJIhYgGXwgE3wiGSAbhUIwiSIbIBd8Ihd8Ih4gFIVCKIkiFCAgfCAMfCIgICGFQjCJIiEgHnwiHiAiICOFQjCJIiIgJHwiIyAOhUIBiSIOIB18IBJ8Ih0gG4VCIIkiGyAafCIaIA6FQiiJIg4gHXwgC3wiHSAbhUIwiSIbIBcgFoVCAYkiFiAYfCANfCIXICKFQiCJIhggFSAffCIVfCIfIBaFQiiJIhYgF3wgEHwiFyAYhUIwiSIYIB98Ih8gFoVCAYkiFiAVIA+FQgGJIg8gGXwgCnwiFSAchUIgiSIZICN8IhwgD4VCKIkiDyAVfCAHfCIVfCASfCIihUIgiSIjfCIkIBaFQiiJIhYgInwgBXwiIiAjhUIwiSIjICR8IiQgFoVCAYkiFiAbIBp8IhogFSAZhUIwiSIVIB4gFIVCAYkiFCAXfCADfCIXhUIgiSIZfCIbIBSFQiiJIhQgF3wgB3wiF3wgAnwiHiAVIBx8IhUgGCAaIA6FQgGJIg4gIHwgC3wiGoVCIIkiGHwiHCAOhUIoiSIOIBp8IAR8IhogGIVCMIkiGIVCIIkiICAfICEgFSAPhUIBiSIPIB18IAZ8IhWFQiCJIh18Ih8gD4VCKIkiDyAVfCAKfCIVIB2FQjCJIh0gH3wiH3wiISAWhUIoiSIWIB58IAx8Ih4gIIVCMIkiICAhfCIhIBogFyAZhUIwiSIXIBt8IhkgFIVCAYkiFHwgEHwiGiAdhUIgiSIbICR8Ih0gFIVCKIkiFCAafCAJfCIaIBuFQjCJIhsgHyAPhUIBiSIPICJ8IBN8Ih8gF4VCIIkiFyAYIBx8Ihh8IhwgD4VCKIkiDyAffCABfCIfIBeFQjCJIhcgHHwiHCAPhUIBiSIPIBggDoVCAYkiDiAVfCAIfCIVICOFQiCJIhggGXwiGSAOhUIoiSIOIBV8IA18IhV8IA18IiKFQiCJIiN8IiQgD4VCKIkiDyAifCAMfCIiICOFQjCJIiMgJHwiJCAPhUIBiSIPIBsgHXwiGyAVIBiFQjCJIhUgISAWhUIBiSIWIB98IBB8IhiFQiCJIh18Ih8gFoVCKIkiFiAYfCAIfCIYfCASfCIhIBUgGXwiFSAXIBsgFIVCAYkiFCAefCAHfCIZhUIgiSIXfCIbIBSFQiiJIhQgGXwgAXwiGSAXhUIwiSIXhUIgiSIeIBwgICAVIA6FQgGJIg4gGnwgAnwiFYVCIIkiGnwiHCAOhUIoiSIOIBV8IAV8IhUgGoVCMIkiGiAcfCIcfCIgIA+FQiiJIg8gIXwgBHwiISAehUIwiSIeICB8IiAgGCAdhUIwiSIYIB98Ih0gFoVCAYkiFiAZfCAGfCIZIBqFQiCJIhogJHwiHyAWhUIoiSIWIBl8IBN8IhkgGoVCMIkiGiAcIA6FQgGJIg4gInwgCXwiHCAYhUIgiSIYIBcgG3wiF3wiGyAOhUIoiSIOIBx8IAN8IhwgGIVCMIkiGCAbfCIbIA6FQgGJIg4gFSAXIBSFQgGJIhR8IAt8IhUgI4VCIIkiFyAdfCIdIBSFQiiJIhQgFXwgCnwiFXwgBHwiIoVCIIkiI3wiJCAOhUIoiSIOICJ8IAl8IiIgGyAeIBUgF4VCMIkiFSAdfCIXIBSFQgGJIhQgGXwgDHwiGYVCIIkiHXwiGyAUhUIoiSIUIBl8IAp8IhkgHYVCMIkiHSAbfCIbIBSFQgGJIhR8IAN8Ih4gGiAffCIaIBUgICAPhUIBiSIPIBx8IAd8IhyFQiCJIhV8Ih8gD4VCKIkiDyAcfCAQfCIcIBWFQjCJIhWFQiCJIiAgFyAYIBogFoVCAYkiFiAhfCATfCIahUIgiSIYfCIXIBaFQiiJIhYgGnwgDXwiGiAYhUIwiSIYIBd8Ihd8IiEgFIVCKIkiFCAefCAFfCIeICCFQjCJIiAgIXwiISAiICOFQjCJIiIgJHwiIyAOhUIBiSIOIBx8IAt8IhwgGIVCIIkiGCAbfCIbIA6FQiiJIg4gHHwgEnwiHCAYhUIwiSIYIBcgFoVCAYkiFiAZfCABfCIXICKFQiCJIhkgFSAffCIVfCIfIBaFQiiJIhYgF3wgBnwiFyAZhUIwiSIZIB98Ih8gFoVCAYkiFiAVIA+FQgGJIg8gGnwgCHwiFSAdhUIgiSIaICN8Ih0gD4VCKIkiDyAVfCACfCIVfCANfCIihUIgiSIjfCIkIBaFQiiJIhYgInwgCXwiIiAjhUIwiSIjICR8IiQgFoVCAYkiFiAYIBt8IhggFSAahUIwiSIVICEgFIVCAYkiFCAXfCASfCIXhUIgiSIafCIbIBSFQiiJIhQgF3wgCHwiF3wgB3wiISAVIB18IhUgGSAYIA6FQgGJIg4gHnwgBnwiGIVCIIkiGXwiHSAOhUIoiSIOIBh8IAt8IhggGYVCMIkiGYVCIIkiHiAfICAgFSAPhUIBiSIPIBx8IAp8IhWFQiCJIhx8Ih8gD4VCKIkiDyAVfCAEfCIVIByFQjCJIhwgH3wiH3wiICAWhUIoiSIWICF8IAN8IiEgHoVCMIkiHiAgfCIgIBggFyAahUIwiSIXIBt8IhogFIVCAYkiFHwgBXwiGCAchUIgiSIbICR8IhwgFIVCKIkiFCAYfCABfCIYIBuFQjCJIhsgHyAPhUIBiSIPICJ8IAx8Ih8gF4VCIIkiFyAZIB18Ihl8Ih0gD4VCKIkiDyAffCATfCIfIBeFQjCJIhcgHXwiHSAPhUIBiSIPIBkgDoVCAYkiDiAVfCAQfCIVICOFQiCJIhkgGnwiGiAOhUIoiSIOIBV8IAJ8IhV8IBN8IiKFQiCJIiN8IiQgD4VCKIkiDyAifCASfCIiICOFQjCJIiMgJHwiJCAPhUIBiSIPIBsgHHwiGyAVIBmFQjCJIhUgICAWhUIBiSIWIB98IAt8IhmFQiCJIhx8Ih8gFoVCKIkiFiAZfCACfCIZfCAJfCIgIBUgGnwiFSAXIBsgFIVCAYkiFCAhfCAFfCIahUIgiSIXfCIbIBSFQiiJIhQgGnwgA3wiGiAXhUIwiSIXhUIgiSIhIB0gHiAVIA6FQgGJIg4gGHwgEHwiFYVCIIkiGHwiHSAOhUIoiSIOIBV8IAF8IhUgGIVCMIkiGCAdfCIdfCIeIA+FQiiJIg8gIHwgDXwiICAhhUIwiSIhIB58Ih4gGSAchUIwiSIZIB98IhwgFoVCAYkiFiAafCAIfCIaIBiFQiCJIhggJHwiHyAWhUIoiSIWIBp8IAp8IhogGIVCMIkiGCAdIA6FQgGJIg4gInwgBHwiHSAZhUIgiSIZIBcgG3wiF3wiGyAOhUIoiSIOIB18IAd8Ih0gGYVCMIkiGSAbfCIbIA6FQgGJIg4gFSAXIBSFQgGJIhR8IAx8IhUgI4VCIIkiFyAcfCIcIBSFQiiJIhQgFXwgBnwiFXwgEnwiIoVCIIkiI3wiJCAOhUIoiSIOICJ8IBN8IiIgGyAhIBUgF4VCMIkiFSAcfCIXIBSFQgGJIhQgGnwgBnwiGoVCIIkiHHwiGyAUhUIoiSIUIBp8IBB8IhogHIVCMIkiHCAbfCIbIBSFQgGJIhR8IA18IiEgGCAffCIYIBUgHiAPhUIBiSIPIB18IAJ8Ih2FQiCJIhV8Ih4gD4VCKIkiDyAdfCABfCIdIBWFQjCJIhWFQiCJIh8gFyAZIBggFoVCAYkiFiAgfCADfCIYhUIgiSIZfCIXIBaFQiiJIhYgGHwgBHwiGCAZhUIwiSIZIBd8Ihd8IiAgFIVCKIkiFCAhfCAIfCIhIB+FQjCJIh8gIHwiICAiICOFQjCJIiIgJHwiIyAOhUIBiSIOIB18IAd8Ih0gGYVCIIkiGSAbfCIbIA6FQiiJIg4gHXwgDHwiHSAZhUIwiSIZIBcgFoVCAYkiFiAafCALfCIXICKFQiCJIhogFSAefCIVfCIeIBaFQiiJIhYgF3wgCXwiFyAahUIwiSIaIB58Ih4gFoVCAYkiFiAVIA+FQgGJIg8gGHwgBXwiFSAchUIgiSIYICN8IhwgD4VCKIkiDyAVfCAKfCIVfCACfCIChUIgiSIifCIjIBaFQiiJIhYgAnwgC3wiAiAihUIwiSILICN8IiIgFoVCAYkiFiAZIBt8IhkgFSAYhUIwiSIVICAgFIVCAYkiFCAXfCANfCINhUIgiSIXfCIYIBSFQiiJIhQgDXwgBXwiBXwgEHwiECAVIBx8Ig0gGiAZIA6FQgGJIg4gIXwgDHwiDIVCIIkiFXwiGSAOhUIoiSIOIAx8IBJ8IhIgFYVCMIkiDIVCIIkiFSAeIB8gDSAPhUIBiSINIB18IAl8IgmFQiCJIg98IhogDYVCKIkiDSAJfCAIfCIJIA+FQjCJIgggGnwiD3wiGiAWhUIoiSIWIBB8IAd8IhAgEYUgDCAZfCIHIA6FQgGJIgwgCXwgCnwiCiALhUIgiSILIAUgF4VCMIkiBSAYfCIJfCIOIAyFQiiJIgwgCnwgE3wiEyALhUIwiSIKIA58IguFNwOAiQFBACADIAYgDyANhUIBiSINIAJ8fCICIAWFQiCJIgUgB3wiBiANhUIoiSIHIAJ8fCICQQApA4iJAYUgBCABIBIgCSAUhUIBiSIDfHwiASAIhUIgiSISICJ8IgkgA4VCKIkiAyABfHwiASAShUIwiSIEIAl8IhKFNwOIiQFBACATQQApA5CJAYUgECAVhUIwiSIQIBp8IhOFNwOQiQFBACABQQApA5iJAYUgAiAFhUIwiSICIAZ8IgGFNwOYiQFBACASIAOFQgGJQQApA6CJAYUgAoU3A6CJAUEAIBMgFoVCAYlBACkDqIkBhSAKhTcDqIkBQQAgASAHhUIBiUEAKQOwiQGFIASFNwOwiQFBACALIAyFQgGJQQApA7iJAYUgEIU3A7iJAQvdAgUBfwF+AX8BfgJ/IwBBwABrIgAkAAJAQQApA9CJAUIAUg0AQQBBACkDwIkBIgFBACgC4IoBIgKsfCIDNwPAiQFBAEEAKQPIiQEgAyABVK18NwPIiQECQEEALQDoigFFDQBBAEJ/NwPYiQELQQBCfzcD0IkBAkAgAkH/AEoNAEEAIQQDQCACIARqQeCJAWpBADoAACAEQQFqIgRBgAFBACgC4IoBIgJrSA0ACwtB4IkBEAIgAEEAKQOAiQE3AwAgAEEAKQOIiQE3AwggAEEAKQOQiQE3AxAgAEEAKQOYiQE3AxggAEEAKQOgiQE3AyAgAEEAKQOoiQE3AyggAEEAKQOwiQE3AzAgAEEAKQO4iQE3AzhBACgC5IoBIgVBAUgNAEEAIQRBACECA0AgBEGACWogACAEai0AADoAACAEQQFqIQQgBSACQQFqIgJB/wFxSg0ACwsgAEHAAGokAAv9AwMBfwF+AX8jAEGAAWsiAiQAQQBBgQI7AfKKAUEAIAE6APGKAUEAIAA6APCKAUGQfiEAA0AgAEGAiwFqQgA3AAAgAEH4igFqQgA3AAAgAEHwigFqQgA3AAAgAEEYaiIADQALQQAhAEEAQQApA/CKASIDQoiS853/zPmE6gCFNwOAiQFBAEEAKQP4igFCu86qptjQ67O7f4U3A4iJAUEAQQApA4CLAUKr8NP0r+68tzyFNwOQiQFBAEEAKQOIiwFC8e30+KWn/aelf4U3A5iJAUEAQQApA5CLAULRhZrv+s+Uh9EAhTcDoIkBQQBBACkDmIsBQp/Y+dnCkdqCm3+FNwOoiQFBAEEAKQOgiwFC6/qG2r+19sEfhTcDsIkBQQBBACkDqIsBQvnC+JuRo7Pw2wCFNwO4iQFBACADp0H/AXE2AuSKAQJAIAFBAUgNACACQgA3A3ggAkIANwNwIAJCADcDaCACQgA3A2AgAkIANwNYIAJCADcDUCACQgA3A0ggAkIANwNAIAJCADcDOCACQgA3AzAgAkIANwMoIAJCADcDICACQgA3AxggAkIANwMQIAJCADcDCCACQgA3AwBBACEEA0AgAiAAaiAAQYAJai0AADoAACAAQQFqIQAgBEEBaiIEQf8BcSABSA0ACyACQYABEAELIAJBgAFqJAALEgAgAEEDdkH/P3EgAEEQdhAECwkAQYAJIAAQAQsGAEGAiQELGwAgAUEDdkH/P3EgAUEQdhAEQYAJIAAQARADCwsLAQBBgAgLBPAAAAA=";
var hash$j = "c6f286e6";
var wasmJson$j = {
	name: name$j,
	data: data$j,
	hash: hash$j
};

new Mutex();
function validateBits$4(bits) {
    if (!Number.isInteger(bits) || bits < 8 || bits > 512 || bits % 8 !== 0) {
        return new Error("Invalid variant! Valid values: 8, 16, ..., 512");
    }
    return null;
}
function getInitParam$1(outputBits, keyBits) {
    return outputBits | (keyBits << 16);
}
/**
 * Creates a new BLAKE2b hash instance
 * @param bits Number of output bits, which has to be a number
 *             divisible by 8, between 8 and 512. Defaults to 512.
 * @param key Optional key (string, Buffer or TypedArray). Maximum length is 64 bytes.
 */
function createBLAKE2b(bits = 512, key = null) {
    if (validateBits$4(bits)) {
        return Promise.reject(validateBits$4(bits));
    }
    let keyBuffer = null;
    let initParam = bits;
    if (key !== null) {
        keyBuffer = getUInt8Buffer(key);
        if (keyBuffer.length > 64) {
            return Promise.reject(new Error("Max key length is 64 bytes"));
        }
        initParam = getInitParam$1(bits, keyBuffer.length);
    }
    const outputSize = bits / 8;
    return WASMInterface(wasmJson$j, outputSize).then((wasm) => {
        if (initParam > 512) {
            wasm.writeMemory(keyBuffer);
        }
        wasm.init(initParam);
        const obj = {
            init: initParam > 512
                ? () => {
                    wasm.writeMemory(keyBuffer);
                    wasm.init(initParam);
                    return obj;
                }
                : () => {
                    wasm.init(initParam);
                    return obj;
                },
            update: (data) => {
                wasm.update(data);
                return obj;
            },
            // biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
            digest: (outputType) => wasm.digest(outputType),
            save: () => wasm.save(),
            load: (data) => {
                wasm.load(data);
                return obj;
            },
            blockSize: 128,
            digestSize: outputSize,
        };
        return obj;
    });
}

function encodeResult(salt, options, res) {
    const parameters = [
        `m=${options.memorySize}`,
        `t=${options.iterations}`,
        `p=${options.parallelism}`,
    ].join(",");
    return `$argon2${options.hashType}$v=19$${parameters}$${encodeBase64(salt, false)}$${encodeBase64(res, false)}`;
}
const uint32View = new DataView(new ArrayBuffer(4));
function int32LE(x) {
    uint32View.setInt32(0, x, true);
    return new Uint8Array(uint32View.buffer);
}
function hashFunc(blake512, buf, len) {
    return __awaiter(this, void 0, void 0, function* () {
        if (len <= 64) {
            const blake = yield createBLAKE2b(len * 8);
            blake.update(int32LE(len));
            blake.update(buf);
            return blake.digest("binary");
        }
        const r = Math.ceil(len / 32) - 2;
        const ret = new Uint8Array(len);
        blake512.init();
        blake512.update(int32LE(len));
        blake512.update(buf);
        let vp = blake512.digest("binary");
        ret.set(vp.subarray(0, 32), 0);
        for (let i = 1; i < r; i++) {
            blake512.init();
            blake512.update(vp);
            vp = blake512.digest("binary");
            ret.set(vp.subarray(0, 32), i * 32);
        }
        const partialBytesNeeded = len - 32 * r;
        let blakeSmall;
        if (partialBytesNeeded === 64) {
            blakeSmall = blake512;
            blakeSmall.init();
        }
        else {
            blakeSmall = yield createBLAKE2b(partialBytesNeeded * 8);
        }
        blakeSmall.update(vp);
        vp = blakeSmall.digest("binary");
        ret.set(vp.subarray(0, partialBytesNeeded), r * 32);
        return ret;
    });
}
function getHashType(type) {
    switch (type) {
        case "d":
            return 0;
        case "i":
            return 1;
        default:
            return 2;
    }
}
function argon2Internal(options) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { parallelism, iterations, hashLength } = options;
        const password = getUInt8Buffer(options.password);
        const salt = getUInt8Buffer(options.salt);
        const version = 0x13;
        const hashType = getHashType(options.hashType);
        const { memorySize } = options; // in KB
        const secret = getUInt8Buffer((_a = options.secret) !== null && _a !== void 0 ? _a : "");
        const [argon2Interface, blake512] = yield Promise.all([
            WASMInterface(wasmJson$k, 1024),
            createBLAKE2b(512),
        ]);
        // last block is for storing the init vector
        argon2Interface.setMemorySize(memorySize * 1024 + 1024);
        const initVector = new Uint8Array(24);
        const initVectorView = new DataView(initVector.buffer);
        initVectorView.setInt32(0, parallelism, true);
        initVectorView.setInt32(4, hashLength, true);
        initVectorView.setInt32(8, memorySize, true);
        initVectorView.setInt32(12, iterations, true);
        initVectorView.setInt32(16, version, true);
        initVectorView.setInt32(20, hashType, true);
        argon2Interface.writeMemory(initVector, memorySize * 1024);
        blake512.init();
        blake512.update(initVector);
        blake512.update(int32LE(password.length));
        blake512.update(password);
        blake512.update(int32LE(salt.length));
        blake512.update(salt);
        blake512.update(int32LE(secret.length));
        blake512.update(secret);
        blake512.update(int32LE(0)); // associatedData length + associatedData
        const segments = Math.floor(memorySize / (parallelism * 4)); // length of each lane
        const lanes = segments * 4;
        const param = new Uint8Array(72);
        const H0 = blake512.digest("binary");
        param.set(H0);
        for (let lane = 0; lane < parallelism; lane++) {
            param.set(int32LE(0), 64);
            param.set(int32LE(lane), 68);
            let position = lane * lanes;
            let chunk = yield hashFunc(blake512, param, 1024);
            argon2Interface.writeMemory(chunk, position * 1024);
            position += 1;
            param.set(int32LE(1), 64);
            chunk = yield hashFunc(blake512, param, 1024);
            argon2Interface.writeMemory(chunk, position * 1024);
        }
        const C = new Uint8Array(1024);
        writeHexToUInt8(C, argon2Interface.calculate(new Uint8Array([]), memorySize));
        const res = yield hashFunc(blake512, C, hashLength);
        if (options.outputType === "hex") {
            const digestChars = new Uint8Array(hashLength * 2);
            return getDigestHex(digestChars, res, hashLength);
        }
        if (options.outputType === "encoded") {
            return encodeResult(salt, options, res);
        }
        // return binary format
        return res;
    });
}
const validateOptions$3 = (options) => {
    var _a;
    if (!options || typeof options !== "object") {
        throw new Error("Invalid options parameter. It requires an object.");
    }
    if (!options.password) {
        throw new Error("Password must be specified");
    }
    options.password = getUInt8Buffer(options.password);
    if (options.password.length < 1) {
        throw new Error("Password must be specified");
    }
    if (!options.salt) {
        throw new Error("Salt must be specified");
    }
    options.salt = getUInt8Buffer(options.salt);
    if (options.salt.length < 8) {
        throw new Error("Salt should be at least 8 bytes long");
    }
    options.secret = getUInt8Buffer((_a = options.secret) !== null && _a !== void 0 ? _a : "");
    if (!Number.isInteger(options.iterations) || options.iterations < 1) {
        throw new Error("Iterations should be a positive number");
    }
    if (!Number.isInteger(options.parallelism) || options.parallelism < 1) {
        throw new Error("Parallelism should be a positive number");
    }
    if (!Number.isInteger(options.hashLength) || options.hashLength < 4) {
        throw new Error("Hash length should be at least 4 bytes.");
    }
    if (!Number.isInteger(options.memorySize)) {
        throw new Error("Memory size should be specified.");
    }
    if (options.memorySize < 8 * options.parallelism) {
        throw new Error("Memory size should be at least 8 * parallelism.");
    }
    if (options.outputType === undefined) {
        options.outputType = "hex";
    }
    if (!["hex", "binary", "encoded"].includes(options.outputType)) {
        throw new Error(`Insupported output type ${options.outputType}. Valid values: ['hex', 'binary', 'encoded']`);
    }
};
/**
 * Calculates hash using the argon2id password-hashing function
 * @returns Computed hash
 */
function argon2id(options) {
    return __awaiter(this, void 0, void 0, function* () {
        validateOptions$3(options);
        return argon2Internal(Object.assign(Object.assign({}, options), { hashType: "id" }));
    });
}

new Mutex();

new Mutex();

new Mutex();

new Mutex();

new Mutex();

new Mutex();

new Mutex();

new Mutex();

new Mutex();

new Mutex();

new Mutex();

new Mutex();

new Mutex();

new Mutex();

new Mutex();

new Mutex();

new Mutex();

new Mutex();

new Mutex();

new Mutex();

/**
 * Utilities for hex, bytes, CSPRNG.
 * @module
 */
/*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) */
/**
 * Checks if something is Uint8Array. Be careful: nodejs Buffer will return true.
 * @param a - Value to inspect.
 * @returns `true` when the value is a Uint8Array view, including Node's `Buffer`.
 * @example
 * Guards a value before treating it as raw key material.
 *
 * ```ts
 * isBytes(new Uint8Array());
 * ```
 */
function isBytes(a) {
    // Plain `instanceof Uint8Array` is too strict for some Buffer / proxy /
    // cross-realm cases. The fallback still requires a real ArrayBuffer view
    // so plain JSON-deserialized `{ constructor: ... }`
    // spoofing is rejected, and `BYTES_PER_ELEMENT === 1` keeps the fallback on byte-oriented views.
    return (a instanceof Uint8Array ||
        (ArrayBuffer.isView(a) &&
            a.constructor.name === 'Uint8Array' &&
            'BYTES_PER_ELEMENT' in a &&
            a.BYTES_PER_ELEMENT === 1));
}
/**
 * Asserts something is boolean.
 * @param b - Value to validate.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Validates a boolean option before branching on it.
 *
 * ```ts
 * abool(true);
 * ```
 */
function abool(b) {
    if (typeof b !== 'boolean')
        throw new TypeError(`boolean expected, not ${b}`);
}
/**
 * Asserts something is a non-negative safe integer.
 * @param n - Value to validate.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Validates a non-negative length or counter.
 *
 * ```ts
 * anumber(1);
 * ```
 */
function anumber(n) {
    if (typeof n !== 'number')
        throw new TypeError('number expected, got ' + typeof n);
    if (!Number.isSafeInteger(n) || n < 0)
        throw new RangeError('positive integer expected, got ' + n);
}
/**
 * Asserts something is Uint8Array.
 * @param value - Value to validate.
 * @param length - Expected byte length.
 * @param title - Optional label used in error messages.
 * @returns The validated byte array.
 * On Node, `Buffer` is accepted too because it is a Uint8Array view.
 * @throws On wrong argument types. {@link TypeError}
 * @throws On wrong argument lengths. {@link RangeError}
 * @example
 * Validates a fixed-length nonce or key buffer.
 *
 * ```ts
 * abytes(new Uint8Array([1, 2]), 2);
 * ```
 */
function abytes(value, length, title = '') {
    const bytes = isBytes(value);
    const len = value?.length;
    const needsLen = length !== undefined;
    if (!bytes || (needsLen && len !== length)) {
        const prefix = title && `"${title}" `;
        const ofLen = needsLen ? ` of length ${length}` : '';
        const got = bytes ? `length=${len}` : `type=${typeof value}`;
        const message = prefix + 'expected Uint8Array' + ofLen + ', got ' + got;
        if (!bytes)
            throw new TypeError(message);
        throw new RangeError(message);
    }
    return value;
}
/**
 * Asserts a hash- or MAC-like instance has not been destroyed or finished.
 * @param instance - Stateful instance to validate.
 * @param checkFinished - Whether to reject finished instances.
 * When `false`, only `destroyed` is checked.
 * @throws If the hash instance has already been destroyed or finalized. {@link Error}
 * @example
 * Guards against calling `update()` or `digest()` on a finished hash.
 *
 * ```ts
 * aexists({ destroyed: false, finished: false });
 * ```
 */
function aexists(instance, checkFinished = true) {
    if (instance.destroyed)
        throw new Error('Hash instance has been destroyed');
    if (checkFinished && instance.finished)
        throw new Error('Hash#digest() has already been called');
}
/**
 * Asserts output is a properly-sized byte array.
 * @param out - Output buffer to validate.
 * @param instance - Hash-like instance providing `outputLen`.
 * This is the relaxed `digestInto()`-style contract: output must be at least `outputLen`,
 * unlike one-shot cipher helpers elsewhere in the repo that often require exact lengths.
 * @throws On wrong argument types. {@link TypeError}
 * @param onlyAligned - Whether `out` must be 4-byte aligned for zero-allocation word views.
 * @throws On wrong output buffer lengths. {@link RangeError}
 * @throws On wrong output buffer alignment. {@link Error}
 * @example
 * Verifies that a caller-provided output buffer is large enough.
 *
 * ```ts
 * aoutput(new Uint8Array(16), { outputLen: 16 });
 * ```
 */
function aoutput(out, instance, onlyAligned = false) {
    abytes(out, undefined, 'output');
    const min = instance.outputLen;
    if (out.length < min) {
        throw new RangeError('digestInto() expects output buffer of length at least ' + min);
    }
    if (onlyAligned && !isAligned32(out))
        throw new Error('invalid output, must be aligned');
}
/**
 * Casts a typed-array view to Uint32Array.
 * @param arr - Typed-array view to reinterpret.
 * @returns Uint32Array view over the same bytes. Callers are expected to provide a
 * 4-byte-aligned offset; trailing `1..3` bytes are silently dropped.
 * @example
 * Views a byte buffer as 32-bit words for block processing.
 *
 * ```ts
 * u32(new Uint8Array(4));
 * ```
 */
function u32(arr) {
    return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
/**
 * Zeroizes typed arrays in place.
 * Warning: JS provides no guarantees.
 * @param arrays - Arrays to wipe.
 * @example
 * Wipes a temporary key buffer after use.
 *
 * ```ts
 * const bytes = new Uint8Array([1]);
 * clean(bytes);
 * ```
 */
function clean(...arrays) {
    for (let i = 0; i < arrays.length; i++) {
        arrays[i].fill(0);
    }
}
/**
 * Creates a DataView for byte-level manipulation.
 * @param arr - Typed-array view to wrap.
 * @returns DataView over the same bytes.
 * @example
 * Creates an endian-aware view for length encoding.
 *
 * ```ts
 * createView(new Uint8Array(4));
 * ```
 */
function createView(arr) {
    return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
/**
 * Whether the current platform is little-endian.
 * Most are; some IBM systems are not.
 */
const isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([0x11223344]).buffer)[0] === 0x44)();
/**
 * Reverses byte order of one 32-bit word.
 * @param word - Unsigned 32-bit word to swap.
 * @returns The same word with bytes reversed.
 * @example
 * Swaps a big-endian word into little-endian byte order.
 *
 * ```ts
 * byteSwap(0x11223344);
 * ```
 */
const byteSwap = (word) => ((word << 24) & 0xff000000) |
    ((word << 8) & 0xff0000) |
    ((word >>> 8) & 0xff00) |
    ((word >>> 24) & 0xff);
/**
 * Normalizes one 32-bit word to the little-endian representation expected by cipher cores.
 * @param n - Unsigned 32-bit word to normalize.
 * @returns Little-endian normalized word on big-endian hosts, else the input word unchanged.
 * @example
 * Normalizes a host-endian word before passing it into an ARX/AES core.
 *
 * ```ts
 * swap8IfBE(0x11223344);
 * ```
 */
const swap8IfBE = isLE
    ? (n) => n
    : (n) => byteSwap(n) >>> 0;
/**
 * Byte-swaps every word of a Uint32Array in place.
 * @param arr - Uint32Array whose words should be swapped.
 * @returns The same array after in-place byte swapping.
 * @example
 * Swaps every 32-bit word in a word-view buffer.
 *
 * ```ts
 * byteSwap32(new Uint32Array([0x11223344]));
 * ```
 */
const byteSwap32 = (arr) => {
    for (let i = 0; i < arr.length; i++)
        arr[i] = byteSwap(arr[i]);
    return arr;
};
/**
 * Normalizes a Uint32Array view to the little-endian representation expected by cipher cores.
 * @param u - Word view to normalize in place.
 * @returns Little-endian normalized word view.
 * @example
 * Normalizes a word-view buffer before block processing.
 *
 * ```ts
 * swap32IfBE(new Uint32Array([0x11223344]));
 * ```
 */
const swap32IfBE = isLE
    ? (u) => u
    : byteSwap32;
/**
 * Merges user options into defaults.
 * @param defaults - Default option values.
 * @param opts - User-provided overrides.
 * @returns Combined options object.
 * The merge mutates `defaults` in place and returns the same object.
 * @throws If options are missing or not an object. {@link Error}
 * @example
 * Applies user overrides to the default cipher options.
 *
 * ```ts
 * checkOpts({ rounds: 20 }, { rounds: 8 });
 * ```
 */
function checkOpts(defaults, opts) {
    if (opts == null || typeof opts !== 'object')
        throw new Error('options must be defined');
    const merged = Object.assign(defaults, opts);
    return merged;
}
/**
 * Compares two byte arrays in kinda constant time once lengths already match.
 * @param a - First byte array.
 * @param b - Second byte array.
 * @returns `true` when the arrays contain the same bytes. Different lengths still return early.
 * @example
 * Compares an expected authentication tag with the received one.
 *
 * ```ts
 * equalBytes(new Uint8Array([1]), new Uint8Array([1]));
 * ```
 */
function equalBytes(a, b) {
    if (a.length !== b.length)
        return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++)
        diff |= a[i] ^ b[i];
    return diff === 0;
}
/**
 * Wraps a keyed MAC constructor into a one-shot helper with `.create()`.
 * @param keyLen - Valid probe-key length used to read static metadata once.
 * The probe key is only used for `outputLen` / `blockLen`, so callers with several valid key sizes
 * can pass any representative size as long as those values stay fixed.
 * @param macCons - Keyed MAC constructor or factory.
 * @param fromMsg - Optional adapter that derives extra constructor args from the one-shot message.
 * @returns Callable MAC helper with `.create()`.
 */
function wrapMacConstructor(keyLen, macCons, fromMsg) {
    const mac = macCons;
    const getArgs = ((() => []));
    const macC = (msg, key) => mac(key, ...getArgs(msg))
        .update(msg)
        .digest();
    const tmp = mac(new Uint8Array(keyLen), ...getArgs(new Uint8Array(0)));
    macC.outputLen = tmp.outputLen;
    macC.blockLen = tmp.blockLen;
    macC.create = (key, ...args) => mac(key, ...args);
    return macC;
}
/**
 * Wraps a cipher: validates args, ensures encrypt() can only be called once.
 * Used internally by the exported cipher constructors.
 * Output-buffer support is inferred from the wrapped `encrypt` / `decrypt`
 * arity (`fn.length === 2`), and tag-bearing constructors are expected to use
 * `args[1]` for optional AAD.
 * @__NO_SIDE_EFFECTS__
 * @param params - Static cipher metadata. See {@link CipherParams}.
 * @param constructor - Cipher constructor.
 * @returns Wrapped constructor with validation.
 */
const wrapCipher = (params, constructor) => {
    function wrappedCipher(key, ...args) {
        // Validate key
        abytes(key, undefined, 'key');
        // Validate nonce if nonceLength is present
        if (params.nonceLength !== undefined) {
            const nonce = args[0];
            abytes(nonce, params.varSizeNonce ? undefined : params.nonceLength, 'nonce');
        }
        // Validate AAD if tagLength present
        const tagl = params.tagLength;
        if (tagl && args[1] !== undefined)
            abytes(args[1], undefined, 'AAD');
        const cipher = constructor(key, ...args);
        const checkOutput = (fnLength, output) => {
            if (output !== undefined) {
                if (fnLength !== 2)
                    throw new Error('cipher output not supported');
                abytes(output, undefined, 'output');
            }
        };
        // Create wrapped cipher with validation and single-use encryption
        let called = false;
        const wrCipher = {
            encrypt(data, output) {
                if (called)
                    throw new Error('cannot encrypt() twice with same key + nonce');
                called = true;
                abytes(data);
                checkOutput(cipher.encrypt.length, output);
                return cipher.encrypt(data, output);
            },
            decrypt(data, output) {
                abytes(data);
                if (tagl && data.length < tagl)
                    throw new Error('"ciphertext" expected length bigger than tagLength=' + tagl);
                checkOutput(cipher.decrypt.length, output);
                return cipher.decrypt(data, output);
            },
        };
        return wrCipher;
    }
    Object.assign(wrappedCipher, params);
    return wrappedCipher;
};
/**
 * By default, returns u8a of length.
 * When out is available, it checks it for validity and uses it.
 * @param expectedLength - Required output length.
 * @param out - Optional destination buffer.
 * @param onlyAligned - Whether `out` must be 4-byte aligned.
 * @returns Output buffer ready for writing.
 * @throws On wrong argument types. {@link TypeError}
 * @throws If the provided output buffer has the wrong size or alignment. {@link Error}
 * @example
 * Reuses a caller-provided output buffer when lengths match.
 *
 * ```ts
 * getOutput(16, new Uint8Array(16));
 * ```
 */
function getOutput(expectedLength, out, onlyAligned = true) {
    if (out === undefined)
        return new Uint8Array(expectedLength);
    // Keep Buffer/cross-realm Uint8Array support here instead of trusting a shape-compatible object.
    abytes(out, undefined, 'output');
    if (out.length !== expectedLength)
        throw new Error('"output" expected Uint8Array of length ' + expectedLength + ', got: ' + out.length);
    if (onlyAligned && !isAligned32(out))
        throw new Error('invalid output, must be aligned');
    return out;
}
/**
 * Encodes data and AAD bit lengths into a 16-byte buffer.
 * @param dataLength - Data length in bits.
 * @param aadLength - AAD length in bits.
 * The serialized block is still `aadLength || dataLength`, matching GCM/Poly1305
 * conventions even though the helper parameter order is `(dataLength, aadLength)`.
 * @param isLE - Whether to encode lengths as little-endian.
 * @returns 16-byte length block.
 * @throws On wrong argument types passed to the endian validator. {@link TypeError}
 * @throws On wrong argument ranges or values. {@link RangeError}
 * @example
 * Builds the length block appended by GCM and Poly1305.
 *
 * ```ts
 * u64Lengths(16, 8, true);
 * ```
 */
function u64Lengths(dataLength, aadLength, isLE) {
    // Reject coercible non-number lengths like '10' and true before BigInt(...) accepts them.
    anumber(dataLength);
    anumber(aadLength);
    abool(isLE);
    const num = new Uint8Array(16);
    const view = createView(num);
    view.setBigUint64(0, BigInt(aadLength), isLE);
    view.setBigUint64(8, BigInt(dataLength), isLE);
    return num;
}
/**
 * Checks whether a byte array is aligned to a 4-byte offset.
 * @param bytes - Byte array to inspect.
 * @returns `true` when the view is 4-byte aligned.
 * @example
 * Checks whether a buffer can be safely viewed as Uint32Array.
 *
 * ```ts
 * isAligned32(new Uint8Array(4));
 * ```
 */
function isAligned32(bytes) {
    return bytes.byteOffset % 4 === 0;
}
/**
 * Copies bytes into a new Uint8Array.
 * @param bytes - Bytes to copy.
 * @returns Copied byte array.
 * @throws On wrong argument types. {@link TypeError}
 * @example
 * Copies input into an aligned Uint8Array before block processing.
 *
 * ```ts
 * copyBytes(new Uint8Array([1, 2]));
 * ```
 */
function copyBytes(bytes) {
    // `Uint8Array.from(...)` would also accept arrays / other typed arrays. Keep this helper strict
    // because callers use it at byte-validation boundaries before mutating the detached copy.
    return Uint8Array.from(abytes(bytes));
}

/**
 * Basic utils for ARX (add-rotate-xor) salsa and chacha ciphers.

RFC8439 requires multi-step cipher stream, where
authKey starts with counter: 0, actual msg with counter: 1.

For this, we need a way to re-use nonce / counter:

    const counter = new Uint8Array(4);
    chacha(..., counter, ...); // counter is now 1
    chacha(..., counter, ...); // counter is now 2

This is complicated:

- 32-bit counters are enough, no need for 64-bit: max ArrayBuffer size in JS is 4GB
- Original papers don't allow mutating counters
- Counter overflow is undefined [^1]
- Idea A: allow providing (nonce | counter) instead of just nonce, re-use it
- Caveat: Cannot be re-used through all cases:
- * chacha has (counter | nonce)
- * xchacha has (nonce16 | counter | nonce16)
- Idea B: separate nonce / counter and provide separate API for counter re-use
- Caveat: there are different counter sizes depending on an algorithm.
- salsa & chacha also differ in structures of key & sigma:
  salsa20:      s[0] | k(4) | s[1] | nonce(2) | cnt(2) | s[2] | k(4) | s[3]
  chacha:       s(4) | k(8) | cnt(1) | nonce(3)
  chacha20orig: s(4) | k(8) | cnt(2) | nonce(2)
- Idea C: helper method such as `setSalsaState(key, nonce, sigma, data)`
- Caveat: we can't re-use counter array

xchacha uses the subkey and remaining 8 byte nonce with ChaCha20 as normal
(prefixed by 4 NUL bytes, since RFC8439 specifies a 12-byte nonce).
Counter overflow is undefined; see {@link https://mailarchive.ietf.org/arch/msg/cfrg/gsOnTJzcbgG6OqD8Sc0GO5aR_tU/ | the CFRG thread}.
Current noble policy is strict non-wrap for the shared 32-bit counter path:
exported ARX ciphers reject initial `0xffffffff` and stop before any implicit
wrap back to zero.
See {@link https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-xchacha#appendix-A.2 | the XChaCha appendix} for the extended-nonce construction.

 * @module
 */
// Replaces `TextEncoder` for ASCII literals, which is enough for sigma constants.
// Non-ASCII input would not match UTF-8 `TextEncoder` output.
const encodeStr = (str) => Uint8Array.from(str.split(''), (c) => c.charCodeAt(0));
// Raw `createCipher(...)` exports consume these native-endian `u32(...)` views directly.
// Public `wrapCipher(...)` APIs reject non-little-endian platforms before reaching this path.
// RFC 8439 §2.3 / RFC 7539 §2.3 only define the 256-bit-key constants; this 16-byte sigma is
// kept for legacy allowShortKeys Salsa/ChaCha variants.
const sigma16_32 = /* @__PURE__ */ (() => swap32IfBE(u32(encodeStr('expand 16-byte k'))))();
// RFC 8439 §2.3 / RFC 7539 §2.3 define words 0-3 as
// `0x61707865 0x3320646e 0x79622d32 0x6b206574`, i.e. `expand 32-byte k`.
const sigma32_32 = /* @__PURE__ */ (() => swap32IfBE(u32(encodeStr('expand 32-byte k'))))();
/**
 * Rotates a 32-bit word left.
 * @param a - Input word.
 * @param b - Rotation count in bits.
 * @returns Rotated 32-bit word.
 * @example
 * Moves the top byte of `0x12345678` into the low byte position.
 * ```ts
 * rotl(0x12345678, 8);
 * ```
 */
function rotl(a, b) {
    return (a << b) | (a >>> (32 - b));
}
// Salsa and Chacha block length is always 512-bit
const BLOCK_LEN = 64;
// RFC 8439 §2.2 / RFC 7539 §2.2: the ChaCha state has 16 32-bit words.
const BLOCK_LEN32 = 16;
// Counter policy for the shared public `counter` argument:
// - RFC/IETF ChaCha20 uses a 32-bit counter.
// - OpenSSL/Node `chacha20` instead treat the full 16-byte IV as a 128-bit
//   counter state and carry into the next word.
// - Raw `chacha20orig`, `salsa20`, `xsalsa20`, and `xchacha20` use 64-bit counters in libsodium
//   and libtomcrypt, while some libs (for example libtomcrypt's RFC/IETF path) reject the max
//   boundary instead of carrying.
// - AEAD wrappers diverge too: libsodium `xchacha20poly1305` uses the IETF payload counter from
//   block 1, while `secretstream_xchacha20poly1305` is a different protocol with rekey/reset.
// Noble intentionally throws instead of silently picking one wrap model for users. In the default
// path, even a 32-bit boundary would take 2^32 blocks * 64 bytes = 256 GiB, which is practically
// unreachable for normal JS callers; advanced users who pass `counter` explicitly can implement
// whatever wider carry / wrap policy they need on top.
const MAX_COUNTER = /* @__PURE__ */ (() => 2 ** 32 - 1)();
const U32_EMPTY = /* @__PURE__ */ Uint32Array.of();
function runCipher(core, sigma, key, nonce, data, output, counter, rounds) {
    const len = data.length;
    const block = new Uint8Array(BLOCK_LEN);
    const b32 = u32(block);
    // Make sure that buffers aligned to 4 bytes
    const isAligned = isLE && isAligned32(data) && isAligned32(output);
    const d32 = isAligned ? u32(data) : U32_EMPTY;
    const o32 = isAligned ? u32(output) : U32_EMPTY;
    // RFC 8439 §2.4.1 / RFC 7539 §2.4.1 allow XORing one keystream block at a time and
    // truncating the final partial block instead of materializing the whole keystream.
    if (!isLE) {
        for (let pos = 0; pos < len; counter++) {
            core(sigma, key, nonce, b32, counter, rounds);
            // RFC 8439 §2.4 / RFC 7539 §2.4 serialize keystream words in little-endian order.
            swap32IfBE(b32);
            if (counter >= MAX_COUNTER)
                throw new Error('arx: counter overflow');
            const take = Math.min(BLOCK_LEN, len - pos);
            for (let j = 0, posj; j < take; j++) {
                posj = pos + j;
                output[posj] = data[posj] ^ block[j];
            }
            pos += take;
        }
        return;
    }
    for (let pos = 0; pos < len; counter++) {
        core(sigma, key, nonce, b32, counter, rounds);
        // See MAX_COUNTER policy note above: never silently wrap the shared public counter.
        if (counter >= MAX_COUNTER)
            throw new Error('arx: counter overflow');
        const take = Math.min(BLOCK_LEN, len - pos);
        // aligned to 4 bytes
        if (isAligned && take === BLOCK_LEN) {
            const pos32 = pos / 4;
            if (pos % 4 !== 0)
                throw new Error('arx: invalid block position');
            for (let j = 0, posj; j < BLOCK_LEN32; j++) {
                posj = pos32 + j;
                o32[posj] = d32[posj] ^ b32[j];
            }
            pos += BLOCK_LEN;
            continue;
        }
        for (let j = 0, posj; j < take; j++) {
            posj = pos + j;
            output[posj] = data[posj] ^ block[j];
        }
        pos += take;
    }
}
/**
 * Creates an ARX stream cipher from a 32-bit core permutation.
 * Used internally to build the exported Salsa and ChaCha stream ciphers.
 * @param core - Core function that fills one keystream block.
 * @param opts - Cipher layout and nonce-extension options. See {@link CipherOpts}.
 * @returns Stream cipher function over byte arrays.
 * @throws If the core callback, key size, counter, or output sizing is invalid. {@link Error}
 */
function createCipher(core, opts) {
    const { allowShortKeys, extendNonceFn, counterLength, counterRight, rounds } = checkOpts({ allowShortKeys: false, counterLength: 8, counterRight: false, rounds: 20 }, opts);
    if (typeof core !== 'function')
        throw new Error('core must be a function');
    anumber(counterLength);
    anumber(rounds);
    abool(counterRight);
    abool(allowShortKeys);
    return (key, nonce, data, output, counter = 0) => {
        abytes(key, undefined, 'key');
        abytes(nonce, undefined, 'nonce');
        abytes(data, undefined, 'data');
        const len = data.length;
        // Raw XorStream APIs return ciphertext/plaintext bytes directly, so caller-provided outputs
        // must match the logical result length exactly instead of returning an oversized workspace.
        output = getOutput(len, output, false);
        anumber(counter);
        // See MAX_COUNTER policy note above: reject advanced explicit-counter requests before any wrap.
        if (counter < 0 || counter >= MAX_COUNTER)
            throw new Error('arx: counter overflow');
        const toClean = [];
        // Key & sigma
        // key=16 -> sigma16, k=key|key
        // key=32 -> sigma32, k=key
        let l = key.length;
        let k;
        let sigma;
        if (l === 32) {
            // Copy caller keys too: big-endian normalization, extended-nonce subkey derivation, and
            // final clean(...) all mutate or wipe the temporary buffer in place.
            toClean.push((k = copyBytes(key)));
            sigma = sigma32_32;
        }
        else if (l === 16 && allowShortKeys) {
            k = new Uint8Array(32);
            k.set(key);
            k.set(key, 16);
            sigma = sigma16_32;
            toClean.push(k);
        }
        else {
            abytes(key, 32, 'arx key');
            throw new Error('invalid key size');
            // throw new Error(`"arx key" expected Uint8Array of length 32, got length=${l}`);
        }
        // Nonce
        // salsa20:      8   (8-byte counter)
        // chacha20orig: 8   (8-byte counter)
        // chacha20:     12  (4-byte counter)
        // xsalsa20:     24  (16 -> hsalsa,  8 -> old nonce)
        // xchacha20:    24  (16 -> hchacha, 8 -> old nonce)
        // Copy before taking u32(...) views on misaligned inputs, and on big-endian so later
        // swap32IfBE(...) never mutates caller nonce bytes in place.
        if (!isLE || !isAligned32(nonce))
            toClean.push((nonce = copyBytes(nonce)));
        let k32 = u32(k);
        // hsalsa & hchacha: handle extended nonce
        if (extendNonceFn) {
            if (nonce.length !== 24)
                throw new Error(`arx: extended nonce must be 24 bytes`);
            const n16 = nonce.subarray(0, 16);
            if (isLE)
                extendNonceFn(sigma, k32, u32(n16), k32);
            else {
                const sigmaRaw = swap32IfBE(Uint32Array.from(sigma));
                extendNonceFn(sigmaRaw, k32, u32(n16), k32);
                clean(sigmaRaw);
                swap32IfBE(k32);
            }
            nonce = nonce.subarray(16);
        }
        else if (!isLE)
            swap32IfBE(k32);
        // Handle nonce counter
        const nonceNcLen = 16 - counterLength;
        if (nonceNcLen !== nonce.length)
            throw new Error(`arx: nonce must be ${nonceNcLen} or 16 bytes`);
        // Normalize 64-bit-nonce layouts to the 12-byte core input: ChaCha/XChaCha prefix 4 zero
        // counter bytes, while Salsa/XSalsa append them after the nonce words.
        if (nonceNcLen !== 12) {
            const nc = new Uint8Array(12);
            nc.set(nonce, counterRight ? 0 : 12 - nonce.length);
            nonce = nc;
            toClean.push(nonce);
        }
        const n32 = swap32IfBE(u32(nonce));
        // Ensure temporary key/nonce copies are wiped even if the remaining
        // runtime guard in runCipher(...) throws on counter overflow.
        try {
            runCipher(core, sigma, k32, n32, data, output, counter, rounds);
            return output;
        }
        finally {
            clean(...toClean);
        }
    };
}

/**
 * Poly1305 ({@link https://cr.yp.to/mac/poly1305-20050329.pdf | PDF},
 * {@link https://en.wikipedia.org/wiki/Poly1305 | wiki})
 * is a fast and parallel secret-key message-authentication code suitable for
 * a wide variety of applications. It was standardized in
 * {@link https://www.rfc-editor.org/rfc/rfc8439 | RFC 8439} and is now used in TLS 1.3.
 *
 * Polynomial MACs are not perfect for every situation:
 * they lack Random Key Robustness: the MAC can be forged, and can't be used in PAKE schemes.
 * See {@link https://keymaterial.net/2020/09/07/invisible-salamanders-in-aes-gcm-siv/ | the invisible salamanders attack writeup}.
 * To combat invisible salamanders, `hash(key)` can be included in ciphertext,
 * however, this would violate ciphertext indistinguishability:
 * an attacker would know which key was used - so `HKDF(key, i)`
 * could be used instead.
 *
 * Check out the {@link https://cr.yp.to/mac.html | original website}.
 * Based on public-domain {@link https://github.com/floodyberry/poly1305-donna | poly1305-donna}.
 * @module
 */
// prettier-ignore
// Little-endian 2-byte load used by the Poly1305 limb decomposition.
function u8to16(a, i) {
    return (a[i++] & 0xff) | ((a[i++] & 0xff) << 8);
}
/**
 * Incremental Poly1305 MAC state.
 * Prefer `poly1305()` for one-shot use.
 * @param key - 32-byte Poly1305 one-time key.
 * @example
 * Feeds one chunk into an incremental Poly1305 state with a fresh one-time key.
 *
 * ```ts
 * import { Poly1305 } from '@noble/ciphers/_poly1305.js';
 * import { randomBytes } from '@noble/ciphers/utils.js';
 * const key = randomBytes(32);
 * const mac = new Poly1305(key);
 * mac.update(new Uint8Array([1, 2, 3]));
 * mac.digest();
 * ```
 */
class Poly1305 {
    blockLen = 16;
    outputLen = 16;
    buffer = new Uint8Array(16);
    r = new Uint16Array(10); // Allocating 1 array with .subarray() here is slower than 3
    h = new Uint16Array(10);
    pad = new Uint16Array(8);
    pos = 0;
    finished = false;
    destroyed = false;
    // Can be speed-up using BigUint64Array, at the cost of complexity
    constructor(key) {
        key = copyBytes(abytes(key, 32, 'key'));
        const t0 = u8to16(key, 0);
        const t1 = u8to16(key, 2);
        const t2 = u8to16(key, 4);
        const t3 = u8to16(key, 6);
        const t4 = u8to16(key, 8);
        const t5 = u8to16(key, 10);
        const t6 = u8to16(key, 12);
        const t7 = u8to16(key, 14);
        // RFC 8439 §2.5.1 / RFC 7539 §2.5.1 clamp r before multiplication.
        // These masks unpack that clamped value into 13-bit limbs, while pad
        // keeps the raw s half for finalize().
        // {@link https://github.com/floodyberry/poly1305-donna/blob/e6ad6e091d30d7f4ec2d4f978be1fcfcbce72781/poly1305-donna-16.h#L47 | poly1305-donna reference}
        this.r[0] = t0 & 0x1fff;
        this.r[1] = ((t0 >>> 13) | (t1 << 3)) & 0x1fff;
        this.r[2] = ((t1 >>> 10) | (t2 << 6)) & 0x1f03;
        this.r[3] = ((t2 >>> 7) | (t3 << 9)) & 0x1fff;
        this.r[4] = ((t3 >>> 4) | (t4 << 12)) & 0x00ff;
        this.r[5] = (t4 >>> 1) & 0x1ffe;
        this.r[6] = ((t4 >>> 14) | (t5 << 2)) & 0x1fff;
        this.r[7] = ((t5 >>> 11) | (t6 << 5)) & 0x1f81;
        this.r[8] = ((t6 >>> 8) | (t7 << 8)) & 0x1fff;
        this.r[9] = (t7 >>> 5) & 0x007f;
        for (let i = 0; i < 8; i++)
            this.pad[i] = u8to16(key, 16 + 2 * i);
    }
    process(data, offset, isLast = false) {
        // RFC 8439 §2.5 / §2.5.1 and RFC 7539 §2.5 / §2.5.1 add an extra high
        // bit to every full 16-byte block. The final partial block gets its
        // explicit `1` byte during digestInto(), so `hibit` stays zero there.
        const hibit = isLast ? 0 : 1 << 11;
        const { h, r } = this;
        const r0 = r[0];
        const r1 = r[1];
        const r2 = r[2];
        const r3 = r[3];
        const r4 = r[4];
        const r5 = r[5];
        const r6 = r[6];
        const r7 = r[7];
        const r8 = r[8];
        const r9 = r[9];
        const t0 = u8to16(data, offset + 0);
        const t1 = u8to16(data, offset + 2);
        const t2 = u8to16(data, offset + 4);
        const t3 = u8to16(data, offset + 6);
        const t4 = u8to16(data, offset + 8);
        const t5 = u8to16(data, offset + 10);
        const t6 = u8to16(data, offset + 12);
        const t7 = u8to16(data, offset + 14);
        let h0 = h[0] + (t0 & 0x1fff);
        let h1 = h[1] + (((t0 >>> 13) | (t1 << 3)) & 0x1fff);
        let h2 = h[2] + (((t1 >>> 10) | (t2 << 6)) & 0x1fff);
        let h3 = h[3] + (((t2 >>> 7) | (t3 << 9)) & 0x1fff);
        let h4 = h[4] + (((t3 >>> 4) | (t4 << 12)) & 0x1fff);
        let h5 = h[5] + ((t4 >>> 1) & 0x1fff);
        let h6 = h[6] + (((t4 >>> 14) | (t5 << 2)) & 0x1fff);
        let h7 = h[7] + (((t5 >>> 11) | (t6 << 5)) & 0x1fff);
        let h8 = h[8] + (((t6 >>> 8) | (t7 << 8)) & 0x1fff);
        let h9 = h[9] + ((t7 >>> 5) | hibit);
        let c = 0;
        let d0 = c + h0 * r0 + h1 * (5 * r9) + h2 * (5 * r8) + h3 * (5 * r7) + h4 * (5 * r6);
        c = d0 >>> 13;
        d0 &= 0x1fff;
        d0 += h5 * (5 * r5) + h6 * (5 * r4) + h7 * (5 * r3) + h8 * (5 * r2) + h9 * (5 * r1);
        c += d0 >>> 13;
        d0 &= 0x1fff;
        let d1 = c + h0 * r1 + h1 * r0 + h2 * (5 * r9) + h3 * (5 * r8) + h4 * (5 * r7);
        c = d1 >>> 13;
        d1 &= 0x1fff;
        d1 += h5 * (5 * r6) + h6 * (5 * r5) + h7 * (5 * r4) + h8 * (5 * r3) + h9 * (5 * r2);
        c += d1 >>> 13;
        d1 &= 0x1fff;
        let d2 = c + h0 * r2 + h1 * r1 + h2 * r0 + h3 * (5 * r9) + h4 * (5 * r8);
        c = d2 >>> 13;
        d2 &= 0x1fff;
        d2 += h5 * (5 * r7) + h6 * (5 * r6) + h7 * (5 * r5) + h8 * (5 * r4) + h9 * (5 * r3);
        c += d2 >>> 13;
        d2 &= 0x1fff;
        let d3 = c + h0 * r3 + h1 * r2 + h2 * r1 + h3 * r0 + h4 * (5 * r9);
        c = d3 >>> 13;
        d3 &= 0x1fff;
        d3 += h5 * (5 * r8) + h6 * (5 * r7) + h7 * (5 * r6) + h8 * (5 * r5) + h9 * (5 * r4);
        c += d3 >>> 13;
        d3 &= 0x1fff;
        let d4 = c + h0 * r4 + h1 * r3 + h2 * r2 + h3 * r1 + h4 * r0;
        c = d4 >>> 13;
        d4 &= 0x1fff;
        d4 += h5 * (5 * r9) + h6 * (5 * r8) + h7 * (5 * r7) + h8 * (5 * r6) + h9 * (5 * r5);
        c += d4 >>> 13;
        d4 &= 0x1fff;
        let d5 = c + h0 * r5 + h1 * r4 + h2 * r3 + h3 * r2 + h4 * r1;
        c = d5 >>> 13;
        d5 &= 0x1fff;
        d5 += h5 * r0 + h6 * (5 * r9) + h7 * (5 * r8) + h8 * (5 * r7) + h9 * (5 * r6);
        c += d5 >>> 13;
        d5 &= 0x1fff;
        let d6 = c + h0 * r6 + h1 * r5 + h2 * r4 + h3 * r3 + h4 * r2;
        c = d6 >>> 13;
        d6 &= 0x1fff;
        d6 += h5 * r1 + h6 * r0 + h7 * (5 * r9) + h8 * (5 * r8) + h9 * (5 * r7);
        c += d6 >>> 13;
        d6 &= 0x1fff;
        let d7 = c + h0 * r7 + h1 * r6 + h2 * r5 + h3 * r4 + h4 * r3;
        c = d7 >>> 13;
        d7 &= 0x1fff;
        d7 += h5 * r2 + h6 * r1 + h7 * r0 + h8 * (5 * r9) + h9 * (5 * r8);
        c += d7 >>> 13;
        d7 &= 0x1fff;
        let d8 = c + h0 * r8 + h1 * r7 + h2 * r6 + h3 * r5 + h4 * r4;
        c = d8 >>> 13;
        d8 &= 0x1fff;
        d8 += h5 * r3 + h6 * r2 + h7 * r1 + h8 * r0 + h9 * (5 * r9);
        c += d8 >>> 13;
        d8 &= 0x1fff;
        let d9 = c + h0 * r9 + h1 * r8 + h2 * r7 + h3 * r6 + h4 * r5;
        c = d9 >>> 13;
        d9 &= 0x1fff;
        d9 += h5 * r4 + h6 * r3 + h7 * r2 + h8 * r1 + h9 * r0;
        c += d9 >>> 13;
        d9 &= 0x1fff;
        c = ((c << 2) + c) | 0;
        c = (c + d0) | 0;
        d0 = c & 0x1fff;
        c = c >>> 13;
        d1 += c;
        h[0] = d0;
        h[1] = d1;
        h[2] = d2;
        h[3] = d3;
        h[4] = d4;
        h[5] = d5;
        h[6] = d6;
        h[7] = d7;
        h[8] = d8;
        h[9] = d9;
    }
    finalize() {
        const { h, pad } = this;
        const g = new Uint16Array(10);
        let c = h[1] >>> 13;
        h[1] &= 0x1fff;
        for (let i = 2; i < 10; i++) {
            h[i] += c;
            c = h[i] >>> 13;
            h[i] &= 0x1fff;
        }
        h[0] += c * 5;
        c = h[0] >>> 13;
        h[0] &= 0x1fff;
        h[1] += c;
        c = h[1] >>> 13;
        h[1] &= 0x1fff;
        h[2] += c;
        // RFC 8439 §2.5 / RFC 7539 §2.5 reduce modulo 2^130-5 before repacking
        // to 16-bit words and adding the raw s half.
        g[0] = h[0] + 5;
        c = g[0] >>> 13;
        g[0] &= 0x1fff;
        for (let i = 1; i < 10; i++) {
            g[i] = h[i] + c;
            c = g[i] >>> 13;
            g[i] &= 0x1fff;
        }
        g[9] -= 1 << 13;
        let mask = (c ^ 1) - 1;
        for (let i = 0; i < 10; i++)
            g[i] &= mask;
        mask = ~mask;
        for (let i = 0; i < 10; i++)
            h[i] = (h[i] & mask) | g[i];
        h[0] = (h[0] | (h[1] << 13)) & 0xffff;
        h[1] = ((h[1] >>> 3) | (h[2] << 10)) & 0xffff;
        h[2] = ((h[2] >>> 6) | (h[3] << 7)) & 0xffff;
        h[3] = ((h[3] >>> 9) | (h[4] << 4)) & 0xffff;
        h[4] = ((h[4] >>> 12) | (h[5] << 1) | (h[6] << 14)) & 0xffff;
        h[5] = ((h[6] >>> 2) | (h[7] << 11)) & 0xffff;
        h[6] = ((h[7] >>> 5) | (h[8] << 8)) & 0xffff;
        h[7] = ((h[8] >>> 8) | (h[9] << 5)) & 0xffff;
        let f = h[0] + pad[0];
        h[0] = f & 0xffff;
        for (let i = 1; i < 8; i++) {
            f = (((h[i] + pad[i]) | 0) + (f >>> 16)) | 0;
            h[i] = f & 0xffff;
        }
        clean(g);
    }
    update(data) {
        aexists(this);
        abytes(data);
        data = copyBytes(data);
        const { buffer, blockLen } = this;
        const len = data.length;
        for (let pos = 0; pos < len;) {
            const take = Math.min(blockLen - this.pos, len - pos);
            // Fast path: we have at least one block in input
            if (take === blockLen) {
                for (; blockLen <= len - pos; pos += blockLen)
                    this.process(data, pos);
                continue;
            }
            buffer.set(data.subarray(pos, pos + take), this.pos);
            this.pos += take;
            pos += take;
            if (this.pos === blockLen) {
                this.process(buffer, 0, false);
                this.pos = 0;
            }
        }
        return this;
    }
    destroy() {
        // `aexists(this)` guards update/digest paths, so destroy must mark the instance unusable too.
        this.destroyed = true;
        clean(this.h, this.r, this.buffer, this.pad);
    }
    digestInto(out) {
        aexists(this);
        aoutput(out, this);
        this.finished = true;
        const { buffer, h } = this;
        let { pos } = this;
        if (pos) {
            // RFC 8439 §2.5 / RFC 7539 §2.5: the final short block appends a
            // single `0x01` byte and zero-fills the remaining bytes before the
            // last multiplication step.
            buffer[pos++] = 1;
            for (; pos < 16; pos++)
                buffer[pos] = 0;
            this.process(buffer, 0, true);
        }
        this.finalize();
        let opos = 0;
        for (let i = 0; i < 8; i++) {
            out[opos++] = h[i] >>> 0;
            out[opos++] = h[i] >>> 8;
        }
    }
    digest() {
        const { buffer, outputLen } = this;
        this.digestInto(buffer);
        // Copy out before destroy() zeroes the internal buffer.
        const res = buffer.slice(0, outputLen);
        this.destroy();
        return res;
    }
}
/**
 * Poly1305 MAC from RFC 8439.
 * @param msg - Message bytes to authenticate.
 * @param key - 32-byte Poly1305 one-time key.
 * @returns 16-byte authentication tag.
 * @example
 * Authenticates one message with a one-shot Poly1305 call and a fresh key.
 *
 * ```ts
 * import { poly1305 } from '@noble/ciphers/_poly1305.js';
 * import { randomBytes } from '@noble/ciphers/utils.js';
 * const key = randomBytes(32);
 * poly1305(new Uint8Array(), key);
 * ```
 */
const poly1305 = /* @__PURE__ */ wrapMacConstructor(32, (key) => new Poly1305(key));

/**
 * ChaCha stream cipher, released
 * in 2008. Developed after Salsa20, ChaCha aims to increase diffusion per round.
 * It was standardized in
 * {@link https://www.rfc-editor.org/rfc/rfc8439 | RFC 8439} and
 * is now used in TLS 1.3.
 *
 * {@link https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-xchacha | XChaCha20}
 * extended-nonce variant is also provided. Similar to XSalsa, it's safe to use with
 * randomly-generated nonces.
 *
 * Check out
 * {@link http://cr.yp.to/chacha/chacha-20080128.pdf | PDF},
 * {@link https://en.wikipedia.org/wiki/Salsa20 | wiki}, and
 * {@link https://cr.yp.to/chacha.html | website}.
 *
 * @module
 */
/** RFC 8439 §2.3 block core for `state = constants | key | counter | nonce`. */
// prettier-ignore
function chachaCore(s, k, n, out, cnt, rounds = 20) {
    let y00 = s[0], y01 = s[1], y02 = s[2], y03 = s[3], // "expa"   "nd 3"  "2-by"  "te k"
    y04 = k[0], y05 = k[1], y06 = k[2], y07 = k[3], // Key      Key     Key     Key
    y08 = k[4], y09 = k[5], y10 = k[6], y11 = k[7], // Key      Key     Key     Key
    y12 = cnt, y13 = n[0], y14 = n[1], y15 = n[2]; // Counter  Nonce   Nonce   Nonce
    // Save state to temporary variables
    let x00 = y00, x01 = y01, x02 = y02, x03 = y03, x04 = y04, x05 = y05, x06 = y06, x07 = y07, x08 = y08, x09 = y09, x10 = y10, x11 = y11, x12 = y12, x13 = y13, x14 = y14, x15 = y15;
    for (let r = 0; r < rounds; r += 2) {
        x00 = (x00 + x04) | 0;
        x12 = rotl(x12 ^ x00, 16);
        x08 = (x08 + x12) | 0;
        x04 = rotl(x04 ^ x08, 12);
        x00 = (x00 + x04) | 0;
        x12 = rotl(x12 ^ x00, 8);
        x08 = (x08 + x12) | 0;
        x04 = rotl(x04 ^ x08, 7);
        x01 = (x01 + x05) | 0;
        x13 = rotl(x13 ^ x01, 16);
        x09 = (x09 + x13) | 0;
        x05 = rotl(x05 ^ x09, 12);
        x01 = (x01 + x05) | 0;
        x13 = rotl(x13 ^ x01, 8);
        x09 = (x09 + x13) | 0;
        x05 = rotl(x05 ^ x09, 7);
        x02 = (x02 + x06) | 0;
        x14 = rotl(x14 ^ x02, 16);
        x10 = (x10 + x14) | 0;
        x06 = rotl(x06 ^ x10, 12);
        x02 = (x02 + x06) | 0;
        x14 = rotl(x14 ^ x02, 8);
        x10 = (x10 + x14) | 0;
        x06 = rotl(x06 ^ x10, 7);
        x03 = (x03 + x07) | 0;
        x15 = rotl(x15 ^ x03, 16);
        x11 = (x11 + x15) | 0;
        x07 = rotl(x07 ^ x11, 12);
        x03 = (x03 + x07) | 0;
        x15 = rotl(x15 ^ x03, 8);
        x11 = (x11 + x15) | 0;
        x07 = rotl(x07 ^ x11, 7);
        x00 = (x00 + x05) | 0;
        x15 = rotl(x15 ^ x00, 16);
        x10 = (x10 + x15) | 0;
        x05 = rotl(x05 ^ x10, 12);
        x00 = (x00 + x05) | 0;
        x15 = rotl(x15 ^ x00, 8);
        x10 = (x10 + x15) | 0;
        x05 = rotl(x05 ^ x10, 7);
        x01 = (x01 + x06) | 0;
        x12 = rotl(x12 ^ x01, 16);
        x11 = (x11 + x12) | 0;
        x06 = rotl(x06 ^ x11, 12);
        x01 = (x01 + x06) | 0;
        x12 = rotl(x12 ^ x01, 8);
        x11 = (x11 + x12) | 0;
        x06 = rotl(x06 ^ x11, 7);
        x02 = (x02 + x07) | 0;
        x13 = rotl(x13 ^ x02, 16);
        x08 = (x08 + x13) | 0;
        x07 = rotl(x07 ^ x08, 12);
        x02 = (x02 + x07) | 0;
        x13 = rotl(x13 ^ x02, 8);
        x08 = (x08 + x13) | 0;
        x07 = rotl(x07 ^ x08, 7);
        x03 = (x03 + x04) | 0;
        x14 = rotl(x14 ^ x03, 16);
        x09 = (x09 + x14) | 0;
        x04 = rotl(x04 ^ x09, 12);
        x03 = (x03 + x04) | 0;
        x14 = rotl(x14 ^ x03, 8);
        x09 = (x09 + x14) | 0;
        x04 = rotl(x04 ^ x09, 7);
    }
    // RFC 8439 §2.3 / §2.3.1: add the original state words back in state order.
    let oi = 0;
    out[oi++] = (y00 + x00) | 0;
    out[oi++] = (y01 + x01) | 0;
    out[oi++] = (y02 + x02) | 0;
    out[oi++] = (y03 + x03) | 0;
    out[oi++] = (y04 + x04) | 0;
    out[oi++] = (y05 + x05) | 0;
    out[oi++] = (y06 + x06) | 0;
    out[oi++] = (y07 + x07) | 0;
    out[oi++] = (y08 + x08) | 0;
    out[oi++] = (y09 + x09) | 0;
    out[oi++] = (y10 + x10) | 0;
    out[oi++] = (y11 + x11) | 0;
    out[oi++] = (y12 + x12) | 0;
    out[oi++] = (y13 + x13) | 0;
    out[oi++] = (y14 + x14) | 0;
    out[oi++] = (y15 + x15) | 0;
}
/**
 * hchacha hashes key and nonce into key' and nonce' for xchacha20.
 * Algorithmically identical to `hchacha_small`, but this exported path
 * normalizes word order on big-endian hosts.
 * Need to find a way to merge it with `chachaCore` without 25% performance hit.
 * @param s - Sigma constants as 32-bit words.
 * @param k - Key words.
 * @param i - Nonce-prefix words.
 * @param out - Output buffer for the derived subkey.
 * @example
 * Derives the XChaCha subkey from sigma, key, and nonce-prefix words.
 *
 * ```ts
 * const sigma = new Uint32Array(4);
 * const key = new Uint32Array(8);
 * const nonce = new Uint32Array(4);
 * const out = new Uint32Array(8);
 * hchacha(sigma, key, nonce, out);
 * ```
 */
// prettier-ignore
function hchacha(s, k, i, out) {
    let x00 = swap8IfBE(s[0]), x01 = swap8IfBE(s[1]), x02 = swap8IfBE(s[2]), x03 = swap8IfBE(s[3]), x04 = swap8IfBE(k[0]), x05 = swap8IfBE(k[1]), x06 = swap8IfBE(k[2]), x07 = swap8IfBE(k[3]), x08 = swap8IfBE(k[4]), x09 = swap8IfBE(k[5]), x10 = swap8IfBE(k[6]), x11 = swap8IfBE(k[7]), x12 = swap8IfBE(i[0]), x13 = swap8IfBE(i[1]), x14 = swap8IfBE(i[2]), x15 = swap8IfBE(i[3]);
    for (let r = 0; r < 20; r += 2) {
        x00 = (x00 + x04) | 0;
        x12 = rotl(x12 ^ x00, 16);
        x08 = (x08 + x12) | 0;
        x04 = rotl(x04 ^ x08, 12);
        x00 = (x00 + x04) | 0;
        x12 = rotl(x12 ^ x00, 8);
        x08 = (x08 + x12) | 0;
        x04 = rotl(x04 ^ x08, 7);
        x01 = (x01 + x05) | 0;
        x13 = rotl(x13 ^ x01, 16);
        x09 = (x09 + x13) | 0;
        x05 = rotl(x05 ^ x09, 12);
        x01 = (x01 + x05) | 0;
        x13 = rotl(x13 ^ x01, 8);
        x09 = (x09 + x13) | 0;
        x05 = rotl(x05 ^ x09, 7);
        x02 = (x02 + x06) | 0;
        x14 = rotl(x14 ^ x02, 16);
        x10 = (x10 + x14) | 0;
        x06 = rotl(x06 ^ x10, 12);
        x02 = (x02 + x06) | 0;
        x14 = rotl(x14 ^ x02, 8);
        x10 = (x10 + x14) | 0;
        x06 = rotl(x06 ^ x10, 7);
        x03 = (x03 + x07) | 0;
        x15 = rotl(x15 ^ x03, 16);
        x11 = (x11 + x15) | 0;
        x07 = rotl(x07 ^ x11, 12);
        x03 = (x03 + x07) | 0;
        x15 = rotl(x15 ^ x03, 8);
        x11 = (x11 + x15) | 0;
        x07 = rotl(x07 ^ x11, 7);
        x00 = (x00 + x05) | 0;
        x15 = rotl(x15 ^ x00, 16);
        x10 = (x10 + x15) | 0;
        x05 = rotl(x05 ^ x10, 12);
        x00 = (x00 + x05) | 0;
        x15 = rotl(x15 ^ x00, 8);
        x10 = (x10 + x15) | 0;
        x05 = rotl(x05 ^ x10, 7);
        x01 = (x01 + x06) | 0;
        x12 = rotl(x12 ^ x01, 16);
        x11 = (x11 + x12) | 0;
        x06 = rotl(x06 ^ x11, 12);
        x01 = (x01 + x06) | 0;
        x12 = rotl(x12 ^ x01, 8);
        x11 = (x11 + x12) | 0;
        x06 = rotl(x06 ^ x11, 7);
        x02 = (x02 + x07) | 0;
        x13 = rotl(x13 ^ x02, 16);
        x08 = (x08 + x13) | 0;
        x07 = rotl(x07 ^ x08, 12);
        x02 = (x02 + x07) | 0;
        x13 = rotl(x13 ^ x02, 8);
        x08 = (x08 + x13) | 0;
        x07 = rotl(x07 ^ x08, 7);
        x03 = (x03 + x04) | 0;
        x14 = rotl(x14 ^ x03, 16);
        x09 = (x09 + x14) | 0;
        x04 = rotl(x04 ^ x09, 12);
        x03 = (x03 + x04) | 0;
        x14 = rotl(x14 ^ x03, 8);
        x09 = (x09 + x14) | 0;
        x04 = rotl(x04 ^ x09, 7);
    }
    // HChaCha derives the subkey from state words 0..3 and 12..15 after 20 rounds.
    let oi = 0;
    out[oi++] = x00;
    out[oi++] = x01;
    out[oi++] = x02;
    out[oi++] = x03;
    out[oi++] = x12;
    out[oi++] = x13;
    out[oi++] = x14;
    out[oi++] = x15;
    swap32IfBE(out);
}
/**
 * XChaCha eXtended-nonce ChaCha. With 24-byte nonce, it's safe to make it random (CSPRNG).
 * See {@link https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-xchacha | the IRTF draft}.
 * The nonce/counter layout still reserves 8 counter bytes internally, but the shared public
 * `counter` argument follows noble's strict non-wrapping 32-bit policy. See `src/_arx.ts`
 * near `MAX_COUNTER` for the full counter-policy rationale.
 * @param key - 32-byte key.
 * @param nonce - 24-byte extended nonce.
 * @param data - Input bytes to xor with the keystream.
 * @param output - Optional destination buffer.
 * @param counter - Initial block counter.
 * @returns Encrypted or decrypted bytes.
 * @example
 * Encrypts bytes with XChaCha20 using a fresh key and random 24-byte nonce.
 *
 * ```ts
 * import { xchacha20 } from '@noble/ciphers/chacha.js';
 * import { randomBytes } from '@noble/ciphers/utils.js';
 * const key = randomBytes(32);
 * const nonce = randomBytes(24);
 * xchacha20(key, nonce, new Uint8Array(4));
 * ```
 */
const xchacha20 = /* @__PURE__ */ createCipher(chachaCore, {
    counterRight: false,
    counterLength: 8,
    extendNonceFn: hchacha,
    allowShortKeys: false,
});
// RFC 8439 §2.8.1 pad16(x): shared zero block for AAD/ciphertext padding.
const ZEROS16 = /* @__PURE__ */ new Uint8Array(16);
// RFC 8439 §2.8 / §2.8.1: aligned inputs add nothing, otherwise append 16-(len%16) zero bytes.
const updatePadded = (h, msg) => {
    h.update(msg);
    const leftover = msg.length % 16;
    if (leftover)
        h.update(ZEROS16.subarray(leftover));
};
// RFC 8439 §2.6.1 poly1305_key_gen returns `block[0..31]`, so AEAD key
// generation only needs 32 zero bytes.
const ZEROS32 = /* @__PURE__ */ new Uint8Array(32);
function computeTag(fn, key, nonce, ciphertext, AAD) {
    if (AAD !== undefined)
        abytes(AAD, undefined, 'AAD');
    // RFC 8439 §2.6 / §2.8: derive the Poly1305 one-time key from counter 0,
    // then MAC AAD || pad16(AAD) || ciphertext || pad16(ciphertext) || len(AAD) || len(ciphertext).
    const authKey = fn(key, nonce, ZEROS32);
    const lengths = u64Lengths(ciphertext.length, AAD ? AAD.length : 0, true);
    // Methods below can be replaced with
    // return poly1305_computeTag_small(authKey, lengths, ciphertext, AAD)
    const h = poly1305.create(authKey);
    if (AAD)
        updatePadded(h, AAD);
    updatePadded(h, ciphertext);
    h.update(lengths);
    const res = h.digest();
    clean(authKey, lengths);
    return res;
}
/**
 * AEAD algorithm from RFC 8439.
 * Salsa20 and chacha (RFC 8439) use poly1305 differently.
 * We could have composed them, but it's hard because of authKey:
 * In salsa20, authKey changes position in salsa stream.
 * In chacha, authKey can't be computed inside computeTag, it modifies the counter.
 */
const _poly1305_aead = (xorStream) => (key, nonce, AAD) => {
    // This borrows caller key/nonce/AAD buffers by reference; mutating them after construction
    // changes future encrypt/decrypt results.
    const tagLength = 16;
    return {
        encrypt(plaintext, output) {
            const plength = plaintext.length;
            output = getOutput(plength + tagLength, output, false);
            output.set(plaintext);
            const oPlain = output.subarray(0, -tagLength);
            // RFC 8439 §2.8: payload encryption starts at counter 1 because counter 0 produced the OTK.
            xorStream(key, nonce, oPlain, oPlain, 1);
            const tag = computeTag(xorStream, key, nonce, oPlain, AAD);
            output.set(tag, plength); // append tag
            clean(tag);
            return output;
        },
        decrypt(ciphertext, output) {
            output = getOutput(ciphertext.length - tagLength, output, false);
            const data = ciphertext.subarray(0, -tagLength);
            const passedTag = ciphertext.subarray(-tagLength);
            const tag = computeTag(xorStream, key, nonce, data, AAD);
            // RFC 8439 §2.8 / §4: authenticate ciphertext before decrypting it, and compare tags with
            // the constant-time equalBytes() helper rather than decrypting speculative plaintext first.
            if (!equalBytes(passedTag, tag)) {
                clean(tag);
                throw new Error('invalid tag');
            }
            output.set(ciphertext.subarray(0, -tagLength));
            // Actual decryption
            xorStream(key, nonce, output, output, 1); // start stream with i=1
            clean(tag);
            return output;
        },
    };
};
/**
 * XChaCha20-Poly1305 extended-nonce chacha.
 *
 * Can be safely used with random nonces (CSPRNG).
 * See {@link https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-xchacha | the IRTF draft}.
 * @param key - 32-byte key.
 * @param nonce - 24-byte nonce.
 * @param AAD - Additional authenticated data.
 * @returns AEAD cipher instance.
 * @example
 * Encrypts and authenticates plaintext with a fresh key and random 24-byte nonce.
 *
 * ```ts
 * import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
 * import { randomBytes } from '@noble/ciphers/utils.js';
 * const key = randomBytes(32);
 * const nonce = randomBytes(24);
 * const cipher = xchacha20poly1305(key, nonce);
 * cipher.encrypt(new Uint8Array([1, 2, 3]));
 * ```
 */
const xchacha20poly1305 = /* @__PURE__ */ wrapCipher({ blockSize: 64, nonceLength: 24, tagLength: 16 }, 
/* @__PURE__ */ _poly1305_aead(xchacha20));

const XCHACHA_KEY_SIZE = 32;
const XCHACHA_NONCE_SIZE = 24;
const WALLET_CIPHER_ALGORITHM = 'XChaCha20-Poly1305';
const fallbackArgonConfig = {
	parallelism: 1,
	iterations: 256,
	memorySize: 512,
	hashLength: 32,
	saltLength: 32,
};
function isBinaryStateKey(key) {
	return key === 'master_seed' || key === 'master_key' || key === 'master_nonce' || key === 'master_salt';
}
function getWalletClassConfig(source) {
	const classRef = source?.constructor;
	return {
		WALLET_SAVE_KIND: classRef?.WALLET_SAVE_KIND || 'wallet.viat',
		WALLET_SAVE_VERSION: classRef?.WALLET_SAVE_VERSION || 1,
		DEFAULT_WALLET_NAME: classRef?.DEFAULT_WALLET_NAME || 'wallet',
		DEFAULT_WALLET_STORAGE_KEY: classRef?.DEFAULT_WALLET_STORAGE_KEY || 'viat.wallet',
		DEFAULT_ARGON_CONFIG: classRef?.DEFAULT_ARGON_CONFIG || fallbackArgonConfig,
	};
}
function getWalletDefaults() {
	return getWalletClassConfig(this);
}
function normalizeWalletSeeds(source = {}) {
	const seed = source?.seed ? toBuffer(source.seed) : undefined;
	const trapdoorSource = source?.trapdoorSeed || source?.trapdoor;
	const trapdoorSeed = trapdoorSource ? toBuffer(trapdoorSource) : undefined;
	const target = {};
	if (seed) {
		target.seed = seed;
	}
	if (trapdoorSeed) {
		target.trapdoorSeed = trapdoorSeed;
		target.trapdoor = trapdoorSeed;
	}
	return target;
}
function normalizeHdState(source = {}) {
	const target = {};
	eachObject(source || {}, (value, key) => {
		target[key] = (isBinaryStateKey(key) && value) ? toBuffer(value) : value;
	});
	return target;
}
function normalizeWalletSecret(source = {}) {
	const walletSeeds = this.normalizeWalletSeeds(source?.walletSeeds || source?.seedData || source);
	const hdStateSource = source?.hdState || source?.STATE || source?.hdSeedState;
	const hdState = hdStateSource ? this.normalizeHdState(hdStateSource) : undefined;
	return {
		walletSeeds,
		hdState,
		savedAt: source?.savedAt || source?.createdAt || new Date().toISOString(),
		walletType: source?.walletType || 'site',
	};
}
function normalizeMeta(source) {
	if (!hasValue(source)) {
		return source;
	}
	if (typeof source === 'bigint') {
		return source.toString();
	}
	if (source instanceof Date) {
		return source.toISOString();
	}
	if (isString(source) || typeof source === 'number' || typeof source === 'boolean') {
		return source;
	}
	if (source instanceof Uint8Array || source instanceof ArrayBuffer || ArrayBuffer.isView(source)) {
		return toBase64(source);
	}
	if (isArray(source)) {
		const target = new Array(source.length);
		for (let index = 0; index < source.length; index += 1) {
			target[index] = this.normalizeMeta(source[index]);
		}
		return target;
	}
	if (isPlainObject(source)) {
		const target = {};
		eachObject(source, (value, key) => {
			const normalizedValue = this.normalizeMeta(value);
			if (normalizedValue !== undefined) {
				target[key] = normalizedValue;
			}
		});
		return target;
	}
	return undefined;
}
function canonicalizeMeta(source) {
	if (isArray(source)) {
		const target = new Array(source.length);
		for (let index = 0; index < source.length; index += 1) {
			target[index] = this.canonicalizeMeta(source[index]);
		}
		return target;
	}
	if (source && isPlainObject(source)) {
		const target = {};
		const keys = Object.keys(source).sort();
		for (let index = 0; index < keys.length; index += 1) {
			const key = keys[index];
			target[key] = this.canonicalizeMeta(source[key]);
		}
		return target;
	}
	return source;
}
function cleanupMeta(source = {}) {
	const target = {};
	eachObject(source, (value, key) => {
		if (value !== undefined) {
			target[key] = value;
		}
	});
	return target;
}
function getCrypto() {
	const cryptoAPI = globalThis.crypto;
	if (!cryptoAPI?.getRandomValues) {
		throw new Error('A crypto.getRandomValues source is required to save or load wallet seed data.');
	}
	return cryptoAPI;
}
function randomBytes(size) {
	const target = new Uint8Array(size);
	this.getCrypto().getRandomValues(target);
	return target;
}
function assertUserInput(userInput) {
	if (!hasValue(userInput) || userInput === '') {
		throw new Error('User input is required to encrypt or decrypt wallet seed data.');
	}
}
function resolvePasswordHashBypass(options = {}, meta = undefined) {
	if (typeof options?.bypassPasswordHash === 'boolean') {
		return options.bypassPasswordHash;
	}
	if (typeof options?.skipPasswordHash === 'boolean') {
		return options.skipPasswordHash;
	}
	if (typeof options?.skipArgon2id === 'boolean') {
		return options.skipArgon2id;
	}
	if (typeof options?.useArgon2id === 'boolean') {
		return options.useArgon2id === false;
	}
	if (meta?.password?.hashMode) {
		return meta.password.hashMode !== 'argon2id';
	}
	return false;
}
function getArgonConfig(options = {}, meta = undefined) {
	const metaPassword = meta?.password || {};
	const defaults = this.getWalletDefaults().DEFAULT_ARGON_CONFIG;
	return {
		parallelism: options?.argonParallelism || options?.parallelism || metaPassword.parallelism || defaults.parallelism,
		iterations: options?.argonIterations || options?.iterations || metaPassword.iterations || defaults.iterations,
		memorySize: options?.argonMemorySize || options?.memorySize || metaPassword.memorySize || defaults.memorySize,
		hashLength: options?.argonHashLength || options?.hashLength || metaPassword.hashLength || defaults.hashLength,
		saltLength: options?.passwordSaltLength || options?.saltLength || metaPassword.saltLength || defaults.saltLength,
	};
}
function toEncryptionKey(source) {
	const bytes = toUint8Array(source);
	if (bytes.byteLength === XCHACHA_KEY_SIZE) {
		return bytes;
	}
	return new Uint8Array(shake256(bytes, {
		dkLen: XCHACHA_KEY_SIZE,
	}));
}
async function derivePasswordKey(userInput, salt, options = {}, meta = undefined) {
	this.assertUserInput(userInput);
	if (this.resolvePasswordHashBypass(options, meta)) {
		return this.toEncryptionKey(userInput);
	}
	const argonConfig = this.getArgonConfig(options, meta);
	const password = isString(userInput) ? userInput : toBase64(userInput);
	const hash = await argon2id({
		password,
		salt: toUint8Array(salt),
		parallelism: argonConfig.parallelism,
		iterations: argonConfig.iterations,
		memorySize: argonConfig.memorySize,
		hashLength: argonConfig.hashLength,
		outputType: 'binary',
	});
	return this.toEncryptionKey(hash);
}
async function encodeAuthenticatedMeta(meta) {
	return toUint8Array(await encode(this.canonicalizeMeta(meta)));
}
function getWalletLabel(options = {}) {
	const defaults = this.getWalletDefaults();
	const source = options?.label || options?.name || options?.fileName || defaults.DEFAULT_WALLET_NAME;
	return `${source}`.trim() || defaults.DEFAULT_WALLET_NAME;
}
function getWalletBaseName(options = {}) {
	const defaults = this.getWalletDefaults();
	const baseName = this.getWalletLabel(options)
		.replace(/\.(cbor|json)\.wallet\.viat$/i, '')
		.replace(/[^a-z0-9.-]+/gi, '-')
		.replace(/^-+|-+$/g, '');
	return baseName || defaults.DEFAULT_WALLET_NAME;
}
function getWalletStorageKey(options = {}) {
	const defaults = this.getWalletDefaults();
	if (options?.storageKey) {
		return options.storageKey;
	}
	const baseName = this.getWalletBaseName(options);
	if (baseName === defaults.DEFAULT_WALLET_NAME) {
		return defaults.DEFAULT_WALLET_STORAGE_KEY;
	}
	return `${defaults.DEFAULT_WALLET_STORAGE_KEY}.${baseName}`;
}
function normalizeSaveFormat(source) {
	return `${source || 'cbor'}`.toLowerCase() === 'json' ? 'json' : 'cbor';
}
function getWalletFileFormat(options = {}) {
	return this.normalizeSaveFormat(options?.fileFormat || options?.format || options?.encoding || 'cbor');
}
function getWalletFileName(options = {}) {
	const baseName = this.getWalletBaseName(options);
	const format = this.getWalletFileFormat(options);
	return `${baseName}.${format}.wallet.viat`;
}
function getWalletMimeType(format) {
	return format === 'json' ? 'application/json' : 'application/cbor';
}
function encodePlainValue(source) {
	if (!hasValue(source)) {
		return undefined;
	}
	return isString(source) ? source : toBase64(source);
}
async function ensureWalletSeeds() {
	const currentSeeds = this.normalizeWalletSeeds(await this.get('walletSeeds'));
	if (currentSeeds?.seed && (currentSeeds?.trapdoorSeed || currentSeeds?.trapdoor)) {
		await this.set('walletSeeds', currentSeeds);
		return currentSeeds;
	}
	const hdWalletInstance = await this.get('hdWalletInstance');
	if (hdWalletInstance?.getWalletSeed) {
		return this.createSiteWallet();
	}
	throw new Error('Wallet seed data is not initialized. Generate or load a wallet before saving it.');
}
async function ensureWalletKeys() {
	await this.ensureWalletSeeds();
	const primaryKeypair = await this.get('primaryKeypair');
	const trapdoorKeypair = await this.get('trapdoorKeypair');
	if (!primaryKeypair?.publicKey || !trapdoorKeypair?.publicKey) {
		await this.setKeypairs();
	}
	if (!(await this.get('trapdoorHash'))) {
		await this.set('trapdoorHash', await this.getTrapdoorHash());
	}
	return this.get('walletSeeds');
}
async function exportWalletSecret(options = {}) {
	const walletSeeds = this.normalizeWalletSeeds(await this.ensureWalletSeeds());
	const hdWalletInstance = await this.get('hdWalletInstance');
	let hdState;
	if (options?.includeHdState !== false && hdWalletInstance?.exportObject) {
		hdState = this.normalizeHdState(await hdWalletInstance.exportObject());
	}
	return {
		walletType: 'site',
		savedAt: new Date().toISOString(),
		walletSeeds,
		hdState,
	};
}
async function getWalletMeta(options = {}) {
	const defaults = this.getWalletDefaults();
	await this.ensureWalletKeys();
	const primaryKeypair = await this.get('primaryKeypair');
	// `trapdoorKeypair.publicKey` (~1.3 KB) is regenerable from
	// `walletSeeds.trapdoorSeed` via `ml_dsa44.keygen`, so we omit it from the
	// saved meta. We still derive the trapdoor hash here because it's used for
	// the wallet address.
	const trapdoorHash = (await this.get('trapdoorHash')) || await this.getTrapdoorHash();
	const argonConfig = this.getArgonConfig(options);
	const hashMode = this.resolvePasswordHashBypass(options) ? 'provided' : 'argon2id';
	let address;
	try {
		address = await this.generateLegacyAddress();
	} catch {
		address = undefined;
	}
	const extra = this.normalizeMeta(options?.meta || options?.walletMeta);
	return this.cleanupMeta({
		app: 'viat',
		kind: defaults.WALLET_SAVE_KIND,
		version: defaults.WALLET_SAVE_VERSION,
		walletType: 'site',
		createdAt: options?.createdAt || new Date().toISOString(),
		label: this.getWalletLabel(options),
		address: this.encodePlainValue(address),
		publicKey: primaryKeypair?.publicKey ? toBase64(primaryKeypair.publicKey) : undefined,
		trapdoorHash: trapdoorHash ? toBase64(trapdoorHash) : undefined,
		password: {
			hashMode,
			parallelism: argonConfig.parallelism,
			iterations: argonConfig.iterations,
			memorySize: argonConfig.memorySize,
			hashLength: argonConfig.hashLength,
			saltLength: argonConfig.saltLength,
		},
		cipher: {
			algorithm: WALLET_CIPHER_ALGORITHM,
			nonceLength: XCHACHA_NONCE_SIZE,
			innerEncoding: 'cbor',
		},
		extra: extra && Object.keys(extra).length ? extra : undefined,
	});
}
async function encryptWalletSecret(secret, meta, userInput, options = {}) {
	const salt = this.randomBytes(this.getArgonConfig(options, meta).saltLength);
	const nonce = this.randomBytes(XCHACHA_NONCE_SIZE);
	const keyBytes = await this.derivePasswordKey(userInput, salt, options, meta);
	const aad = await this.encodeAuthenticatedMeta(meta);
	const plaintext = toUint8Array(await encode(secret));
	const cipher = xchacha20poly1305(toUint8Array(keyBytes), nonce, aad);
	const data = cipher.encrypt(plaintext);
	return {
		salt,
		nonce,
		data,
	};
}
async function decryptWalletSecret(walletPackage, userInput, options = {}) {
	const keyBytes = await this.derivePasswordKey(userInput, walletPackage.encrypted.salt, options, walletPackage.meta);
	const aad = await this.encodeAuthenticatedMeta(walletPackage.meta);
	const cipher = xchacha20poly1305(toUint8Array(keyBytes), toUint8Array(walletPackage.encrypted.nonce), aad);
	let decrypted;
	try {
		decrypted = cipher.decrypt(toUint8Array(walletPackage.encrypted.data));
	} catch {
		throw new Error('Unable to decrypt the saved wallet data. Wrong password or corrupted payload.');
	}
	return this.normalizeWalletSecret(await decode(toBuffer(decrypted)));
}
function createWalletPackageShape(walletPackage, format) {
	const defaults = this.getWalletDefaults();
	return {
		kind: walletPackage.kind || defaults.WALLET_SAVE_KIND,
		version: walletPackage.version || defaults.WALLET_SAVE_VERSION,
		encoding: format,
		meta: walletPackage.meta,
		encrypted: {
			innerEncoding: walletPackage.encrypted?.innerEncoding || 'cbor',
			salt: format === 'json' ? toBase64(walletPackage.encrypted.salt) : toUint8Array(walletPackage.encrypted.salt),
			nonce: format === 'json' ? toBase64(walletPackage.encrypted.nonce) : toUint8Array(walletPackage.encrypted.nonce),
			data: format === 'json' ? toBase64(walletPackage.encrypted.data) : toUint8Array(walletPackage.encrypted.data),
		},
	};
}
function normalizeWalletPackage(source = {}) {
	const encrypted = source?.encrypted;
	const nonceField = encrypted?.nonce;
	if (!encrypted?.data || !nonceField || !encrypted?.salt) {
		throw new Error('Invalid wallet package: encrypted seed data is missing.');
	}
	const defaults = this.getWalletDefaults();
	return {
		kind: source.kind || defaults.WALLET_SAVE_KIND,
		version: source.version || defaults.WALLET_SAVE_VERSION,
		encoding: this.normalizeSaveFormat(source.encoding),
		meta: this.cleanupMeta(this.normalizeMeta(source.meta || {})),
		encrypted: {
			innerEncoding: encrypted.innerEncoding || 'cbor',
			salt: isString(encrypted.salt) ? fromBase64(encrypted.salt) : toUint8Array(encrypted.salt),
			nonce: isString(nonceField) ? fromBase64(nonceField) : toUint8Array(nonceField),
			data: isString(encrypted.data) ? fromBase64(encrypted.data) : toUint8Array(encrypted.data),
		},
	};
}
async function createWalletPackage(userInput, options = {}) {
	const defaults = this.getWalletDefaults();
	const secret = await this.exportWalletSecret(options);
	const meta = await this.getWalletMeta(options);
	const encrypted = await this.encryptWalletSecret(secret, meta, userInput, options);
	return {
		kind: defaults.WALLET_SAVE_KIND,
		version: defaults.WALLET_SAVE_VERSION,
		meta,
		encrypted: {
			innerEncoding: 'cbor',
			salt: encrypted.salt,
			nonce: encrypted.nonce,
			data: encrypted.data,
		},
	};
}
async function serializeWalletPackage(walletPackage, format = 'json', options = {}) {
	const normalizedFormat = this.normalizeSaveFormat(format);
	const packageShape = this.createWalletPackageShape(walletPackage, normalizedFormat);
	if (normalizedFormat === 'json') {
		return JSON.stringify(packageShape, null, options?.prettyJson ? 2 : 0);
	}
	return encode(packageShape);
}
function detectWalletFileFormat(source, options = {}) {
	const fileName = options?.file?.name || options?.fileName;
	if (fileName?.endsWith('.json.wallet.viat')) {
		return 'json';
	}
	if (fileName?.endsWith('.cbor.wallet.viat')) {
		return 'cbor';
	}
	const bytes = isString(source) ? textToBuffer(source) : toUint8Array(source);
	const text = decodeText(bytes).trimStart();
	if (text.startsWith('{')) {
		return 'json';
	}
	return this.getWalletFileFormat(options);
}
async function deserializeWalletPackage(source, format, options = {}) {
	const normalizedFormat = this.normalizeSaveFormat(format || this.detectWalletFileFormat(source, options));
	if (normalizedFormat === 'json') {
		const text = isString(source) ? source : decodeText(toUint8Array(source));
		return this.normalizeWalletPackage(JSON.parse(text));
	}
	return this.normalizeWalletPackage(await decode(toBuffer(source)));
}
async function readWalletFileSource(source) {
	if (isBlobLike(source)) {
		return new Uint8Array(await source.arrayBuffer());
	}
	if (source instanceof ArrayBuffer || ArrayBuffer.isView(source)) {
		return toUint8Array(source);
	}
	if (isString(source)) {
		return textToBuffer(source);
	}
	throw new Error('Unsupported wallet file source. Provide a File, Blob, ArrayBuffer, TypedArray, or raw text.');
}
async function downloadWalletBlob(blob, fileName) {
	if (typeof document === 'undefined') {
		throw new Error('A browser document is required to download wallet files.');
	}
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = fileName;
	link.rel = 'noopener';
	link.click();
	function revokeURL() {
		URL.revokeObjectURL(url);
	}
	setTimeout(revokeURL, 0);
	return {
		url,
		fileName,
	};
}
async function pickWalletFile() {
	if (typeof showOpenFilePicker === 'function') {
		const handles = await showOpenFilePicker({
			multiple: false,
			types: [
				{
					description: 'VIAT wallet files',
					accept: {
						'application/cbor': ['.cbor.wallet.viat'],
						'application/json': ['.json.wallet.viat'],
					},
				},
			],
		});
		if (handles?.length) {
			return handles[0].getFile();
		}
	}
	if (typeof document === 'undefined') {
		throw new Error('A browser file picker is required to load a wallet file from disk.');
	}
	return new Promise((resolve, reject) => {
		const input = document.createElement('input');
		function onChange() {
			resolve(input.files?.[0]);
		}
		function onError(error) {
			reject(error);
		}
		input.type = 'file';
		input.accept = '.cbor.wallet.viat,.json.wallet.viat,.wallet.viat,application/cbor,application/json';
		input.onchange = onChange;
		input.onerror = onError;
		input.click();
	});
}
async function applyWalletSecret(secret, meta) {
	const walletSecret = this.normalizeWalletSecret(secret);
	if (!walletSecret.walletSeeds?.seed || !walletSecret.walletSeeds?.trapdoorSeed) {
		throw new Error('Loaded wallet seed data is incomplete.');
	}
	let hdWalletInstance;
	if (walletSecret.hdState) {
		hdWalletInstance = await HDSeed.createSiteWallet();
		if (hdWalletInstance?.importObject) {
			await hdWalletInstance.importObject(walletSecret.hdState);
		}
	}
	await this.set('hdWalletInstance', hdWalletInstance);
	await this.set('walletSeeds', walletSecret.walletSeeds);
	await this.setKeypairs();
	await this.set('trapdoorHash', await this.getTrapdoorHash());
	await this.set('walletSaveMeta', meta);
	await this.set('walletSecret', walletSecret);
	return {
		walletSeeds: walletSecret.walletSeeds,
		hdWalletInstance,
		primaryKeypair: await this.get('primaryKeypair'),
		trapdoorKeypair: await this.get('trapdoorKeypair'),
		trapdoorHash: await this.get('trapdoorHash'),
	};
}
async function importWalletPackage(source, userInput, options = {}) {
	const walletPackage = this.normalizeWalletPackage(source);
	const defaults = this.getWalletDefaults();
	if (walletPackage.kind && walletPackage.kind !== defaults.WALLET_SAVE_KIND) {
		throw new Error(`Unsupported wallet package kind: ${walletPackage.kind}`);
	}
	const secret = await this.decryptWalletSecret(walletPackage, userInput, options);
	const loaded = await this.applyWalletSecret(secret, walletPackage.meta);
	await this.set('walletPackage', walletPackage);
	return {
		package: walletPackage,
		meta: walletPackage.meta,
		secret,
		...loaded,
	};
}
async function saveWalletToLocalStorage(userInput, options = {}) {
	if (!globalThis.localStorage) {
		throw new Error('localStorage is not available in this browser context.');
	}
	const walletPackage = await this.createWalletPackage(userInput, options);
	const storageKey = this.getWalletStorageKey(options);
	const json = await this.serializeWalletPackage(walletPackage, 'json', options);
	globalThis.localStorage.setItem(storageKey, json);
	await this.set('walletPackage', this.normalizeWalletPackage(JSON.parse(json)));
	await this.set('walletSaveMeta', walletPackage.meta);
	return {
		storageKey,
		meta: walletPackage.meta,
		json,
	};
}
async function loadWalletFromLocalStorage(userInput, options = {}) {
	if (!globalThis.localStorage) {
		throw new Error('localStorage is not available in this browser context.');
	}
	const storageKey = this.getWalletStorageKey(options);
	const rawValue = globalThis.localStorage.getItem(storageKey);
	if (!rawValue) {
		throw new Error(`No saved wallet data was found in localStorage for key: ${storageKey}`);
	}
	return this.importWalletPackage(await this.deserializeWalletPackage(rawValue, 'json', options), userInput, options);
}
async function saveWalletFile(userInput, options = {}) {
	const fileFormat = this.getWalletFileFormat(options);
	const fileName = this.getWalletFileName({
		...options,
		fileFormat,
	});
	const walletPackage = await this.createWalletPackage(userInput, options);
	const data = await this.serializeWalletPackage(walletPackage, fileFormat, options);
	const blob = new Blob([data]);
	if (options?.download !== false) {
		await this.downloadWalletBlob(blob, fileName);
	}
	await this.set('walletPackage', this.normalizeWalletPackage(this.createWalletPackageShape(walletPackage, fileFormat)));
	await this.set('walletSaveMeta', walletPackage.meta);
	return {
		fileName,
		format: fileFormat,
		blob,
		data,
		meta: walletPackage.meta,
	};
}
async function loadWalletFile(userInput, options = {}) {
	const file = options?.file || options?.fileSource || await this.pickWalletFile();
	if (!file) {
		throw new Error('No wallet file was selected.');
	}
	const fileBytes = await this.readWalletFileSource(file);
	const format = this.detectWalletFileFormat(fileBytes, {
		...options,
		file,
	});
	return this.importWalletPackage(await this.deserializeWalletPackage(fileBytes, format, {
		...options,
		file,
	}), userInput, options);
}
const walletPersistence = {
	getWalletDefaults,
	normalizeWalletSeeds,
	normalizeHdState,
	normalizeWalletSecret,
	normalizeMeta,
	canonicalizeMeta,
	cleanupMeta,
	getCrypto,
	randomBytes,
	assertUserInput,
	resolvePasswordHashBypass,
	getArgonConfig,
	toEncryptionKey,
	derivePasswordKey,
	encodeAuthenticatedMeta,
	getWalletLabel,
	getWalletBaseName,
	getWalletStorageKey,
	normalizeSaveFormat,
	getWalletFileFormat,
	getWalletFileName,
	getWalletMimeType,
	encodePlainValue,
	ensureWalletSeeds,
	ensureWalletKeys,
	exportWalletSecret,
	getWalletMeta,
	encryptWalletSecret,
	decryptWalletSecret,
	createWalletPackageShape,
	normalizeWalletPackage,
	createWalletPackage,
	serializeWalletPackage,
	detectWalletFileFormat,
	deserializeWalletPackage,
	readWalletFileSource,
	downloadWalletBlob,
	pickWalletFile,
	applyWalletSecret,
	importWalletPackage,
	saveWalletToLocalStorage,
	loadWalletFromLocalStorage,
	saveWalletFile,
	loadWalletFile,
};

// Endpoints where a 404 is part of the normal flow (e.g. an address has no
// account record yet). These get console-logged but suppressed from the
// in-app notification stream so users don't see "404" noise for expected
// "not yet created" states.
const SILENT_404_PATTERNS = [
	/^\/accounts\/[^/]+$/,
	/^\/accounts\/[^/]+\/transactions/,
];
function shouldSilence(endpoint, status) {
	if (status !== 404) {
		return false;
	}
	for (let index = 0; index < SILENT_404_PATTERNS.length; index += 1) {
		if (SILENT_404_PATTERNS[index].test(endpoint)) {
			return true;
		}
	}
	return false;
}
function dispatchApiError(detail) {
	if (typeof globalThis?.dispatchEvent !== 'function' || typeof globalThis?.CustomEvent !== 'function') {
		return;
	}
	globalThis.dispatchEvent(new globalThis.CustomEvent('viat:api-error', {
		detail,
	}));
}
async function request(method, endpoint, data = null) {
	const url = `${this.baseURL}${endpoint}`;
	const config = {
		method,
		headers: {
			...this.defaultHeaders,
		},
	};
	if (data && (method === 'POST' || method === 'PUT')) {
		if (this.useCBOR) {
			// `encode` is async and returns a Buffer; without awaiting fetch
			// would serialise a Promise body and the server would reject it.
			const encoded = await encode(data);
			config.body = encoded instanceof Uint8Array ? encoded : bufferExports.Buffer.from(encoded);
		} else {
			config.body = JSON.stringify(data);
		}
	}
	let response;
	try {
		response = await fetch(url, config);
	} catch (networkError) {
		const message = networkError?.message || 'Network failure';
		console.warn('[viat:api]', method, endpoint, message);
		dispatchApiError({
			endpoint,
			method,
			status: 0,
			message,
			silent: false,
		});
		return null;
	}
	if (!response.ok) {
		let errorBody = {};
		try {
			errorBody = await this.parseResponse(response);
		} catch (parseError) {
			errorBody = {
				error: response.statusText,
			};
		}
		const message = errorBody?.error || errorBody?.message || `HTTP ${response.status}`;
		const silent = shouldSilence(endpoint, response.status);
		console.warn('[viat:api]', method, endpoint, response.status, message);
		dispatchApiError({
			endpoint,
			method,
			status: response.status,
			message,
			body: errorBody,
			silent,
		});
		return null;
	}
	return this.parseResponse(response);
}
async function parseResponse(response) {
	const contentType = response.headers.get('content-type') || '';
	if (contentType.includes('application/cbor')) {
		const buffer = await response.arrayBuffer();
		return decode(bufferExports.Buffer.from(buffer));
	}
	if (contentType.includes('application/json')) {
		return response.json();
	}
	// Last-resort: try JSON, fall back to text.
	const text = await response.text();
	if (!text) {
		return {};
	}
	try {
		return JSON.parse(text);
	} catch (parseError) {
		return {
			raw: text,
		};
	}
}
async function health() {
	return this.request('GET', '/health');
}
async function createAccount(publicKey, address = null) {
	const data = {
		publicKey: ensureBase64(publicKey),
	};
	if (address) {
		data.address = ensureBase64(address);
	}
	return this.request('POST', '/accounts', data);
}
async function getAccount(address) {
	const addressStr = ensureBase64(address);
	return this.request('GET', `/accounts/${encodeURIComponent(addressStr)}`);
}
async function listRecentAccounts(options = {}) {
	const params = new URLSearchParams();
	if (options.page) {
		params.append('page', String(options.page));
	}
	if (options.limit) {
		params.append('limit', String(options.limit));
	}
	const query = params.toString();
	return this.request('GET', `/accounts${query ? `?${query}` : ''}`);
}
async function getAccountTransactions(address, options = {}) {
	const addressStr = ensureBase64(address);
	const params = new URLSearchParams();
	if (options.page) {
		params.append('page', options.page.toString());
	}
	if (options.limit) {
		params.append('limit', options.limit.toString());
	}
	const query = params.toString();
	const endpoint = `/accounts/${encodeURIComponent(addressStr)}/transactions${query ? `?${query}` : ''}`;
	return this.request('GET', endpoint);
}
async function createTransaction(data) {
	if (!data.publicKey) {
		throw new Error('Public key is required for transaction creation');
	}
	return this.request('POST', '/transactions', data);
}
async function getTransaction(id) {
	if (!id) {
		throw new Error('Transaction id required');
	}
	return this.request('GET', `/transactions/${encodeURIComponent(id)}`);
}
async function listRecentTransactions(options = {}) {
	const params = new URLSearchParams();
	if (options.page) {
		params.append('page', String(options.page));
	}
	if (options.limit) {
		params.append('limit', String(options.limit));
	}
	if (options.type) {
		params.append('type', String(options.type));
	}
	const query = params.toString();
	return this.request('GET', `/transactions${query ? `?${query}` : ''}`);
}
async function mintFunds(toAddress, amount) {
	const data = {
		to: ensureBase64(toAddress),
	};
	return this.request('POST', '/transactions/mint', data);
}
async function setURL(config) {
	const origin = config?.baseURL || globalThis.location?.origin || '';
	this.baseURL = `${String(origin).replace(/\/$/, '')}/api`;
	this.useCBOR = Boolean(config?.useCBOR);
	this.applyAPIHeaders();
}
async function setAPICBORMode(useCBOR) {
	if (typeof useCBOR === 'boolean') {
		this.useCBOR = useCBOR;
	}
	this.applyAPIHeaders();
}
function applyAPIHeaders() {
	this.defaultHeaders = {
		'Content-Type': this.useCBOR ? 'application/cbor' : 'application/json',
		Accept: this.useCBOR ? 'application/cbor' : 'application/json',
	};
}
const webAPI = {
	request,
	parseResponse,
	health,
	createAccount,
	getAccount,
	getAccountTransactions,
	listRecentAccounts,
	createTransaction,
	getTransaction,
	listRecentTransactions,
	mintFunds,
	setURL,
	setAPICBORMode,
	applyAPIHeaders,
};

// Expose the bundled Buffer polyfill globally so consumers of the SDK can use
// it without re-importing the `buffer` package. Skip when a native Buffer is
// already present (Node, Bun) so we don't shadow a faster implementation.
if (!globalThis.Buffer) {
	globalThis.Buffer = bufferExports.Buffer;
}
/** VIAT Cryptocurrency API Client. */
// TODO: EXPOSE UTILS CLASS FOR USERS OF THE SDK
/*
	TODO: Change dilithium and ed25519 to native or wasm variants if present for better performance. Currently using pure JS implementations for compatibility and ease of use in the browser.
*/
class VIATClientSDK {
	static WALLET_SAVE_KIND = 'wallet.viat';
	static WALLET_SAVE_VERSION = 1;
	static DEFAULT_WALLET_NAME = 'wallet';
	static DEFAULT_WALLET_STORAGE_KEY = 'viat.wallet';
	static DEFAULT_ARGON_CONFIG = {
		parallelism: 1,
		iterations: 256,
		memorySize: 512,
		hashLength: 32,
		saltLength: 32,
	};
	static clients = new Map();
	STATE = {};
	wallet = {
		primaryKeypair: {},
		trapdoorKeypair: {},
	};
	constructor(config = {}) {
		this.STATE = {};
		if (config?.useCBOR) {
			this.setCBOR(config?.useCBOR);
		}
		this.setURL(config);
	}
	static async create(config = {}) {
		const client = new VIATClientSDK(config);
		await client.initialize(config);
		return client;
	}
	async initialize(config = {}) {
		if (config?.STATE) {
			await this.setValues(config.STATE);
		}
		return this;
	}
	async setValues(source = {}) {
		const keys = Object.keys(source);
		for (let index = 0; index < keys.length; index += 1) {
			const key = keys[index];
			await this.set(key, source[key]);
		}
		return this;
	}
	async createSiteWallet(config = {}) {
		const hdWalletInstance = (await this.get('hdWalletInstance')) || await this.createSiteWalletInstance(config);
		const walletSeeds = this.normalizeWalletSeeds(await hdWalletInstance.getWalletSeed());
		await this.set('walletSeeds', walletSeeds);
		return walletSeeds;
	}
	async createSiteWalletInstance(config = {}) {
		const hdWalletInstance = await HDSeed.createSiteWallet(config);
		if (config?.STATE && hdWalletInstance?.importObject) {
			await hdWalletInstance.importObject(config.STATE);
		}
		await this.set('hdWalletInstance', hdWalletInstance);
		return hdWalletInstance;
	}
	setCBOR(useCBOR) {
		this.useCBOR = useCBOR;
		this.setAPICBORMode(useCBOR);
	}
	getFormat() {
		return this.useCBOR ? 'CBOR' : 'JSON';
	}
	async setKeypairs() {
		const primaryKeypair = await this.keypair();
		await this.set('primaryKeypair', primaryKeypair);
		const trapdoorKeypair = await this.trapdoorKeypair();
		await this.set('trapdoorKeypair', trapdoorKeypair);
		return {
			primaryKeypair,
			trapdoorKeypair,
		};
	}
	async set(key, value) {
		this.STATE = this.STATE || {};
		this.STATE[key] = value;
		// Avoid shadowing prototype methods (e.g. `trapdoorKeypair`,
		// `primaryKeypair`) that share a name with a state key. Without this
		// guard, a second call to `setKeypairs()` invokes an object as a
		// function and throws.
		let proto = Object.getPrototypeOf(this);
		while (proto && proto !== Object.prototype) {
			if (Object.prototype.hasOwnProperty.call(proto, key) && typeof proto[key] === 'function') {
				return value;
			}
			proto = Object.getPrototypeOf(proto);
		}
		this[key] = value;
		return value;
	}
	async get(key) {
		if (this.STATE && Object.prototype.hasOwnProperty.call(this.STATE, key)) {
			return this.STATE[key];
		}
		return this[key];
	}
	/**
	 * Create a new ed25519 keypair.
	 * @returns {Promise<{ privateKey: Buffer, publicKey: Buffer }>} The derived keypair buffers.
	 */
	async keypair(seed) {
		const walletSeeds = this.normalizeWalletSeeds(await this.get('walletSeeds'));
		const {
			secretKey,
			publicKey,
		} = await ed25519.keygen(seed || walletSeeds.seed);
		return {
			privateKey: bufferExports.Buffer.from(secretKey),
			publicKey: bufferExports.Buffer.from(publicKey),
		};
	}
	async trapdoorKeypair(seed) {
		const walletSeeds = this.normalizeWalletSeeds(await this.get('walletSeeds'));
		const trapdoorSeed = seed || walletSeeds.trapdoorSeed || walletSeeds.trapdoor;
		const {
			secretKey,
			publicKey,
		} = await ml_dsa44.keygen(trapdoorSeed);
		return {
			privateKey: bufferExports.Buffer.from(secretKey),
			publicKey: bufferExports.Buffer.from(publicKey),
		};
	}
	async getTrapdoorHash() {
		const trapdoorKeypair = await this.get('trapdoorKeypair');
		const hash = await shake256(trapdoorKeypair.publicKey);
		return bufferExports.Buffer.from(hash);
	}
	async generateSiteWallet(config = {}) {
		await this.createSiteWalletInstance(config);
		await this.createSiteWallet(config);
		await this.setKeypairs();
		await this.set('trapdoorHash', await this.getTrapdoorHash());
		return this;
	}
	/**
	 * Sign a message with a private key.
	 * @returns {Promise<Buffer>} The detached signature bytes.
	 */
	async sign(message, privateKey) {
		const msg = (isString(message)) ? textToBuffer(message) : bufferExports.Buffer.from(message);
		const priv = bufferExports.Buffer.from(privateKey);
		const sig = await ed25519.sign(msg, priv);
		return bufferExports.Buffer.from(sig);
	}
	/**
	 * Verify a signature for a message and public key.
	 * @returns {Promise<boolean>} True when the signature matches the message and key.
	 */
	async verifySignature(signature, message, publicKey, options = undefined) {
		const sig = bufferExports.Buffer.from(signature);
		const msg = (isString(message)) ? textToBuffer(message) : bufferExports.Buffer.from(message);
		const pub = bufferExports.Buffer.from(publicKey || (await this.get('primaryKeypair')).publicKey);
		return Boolean(await ed25519.verify(sig, msg, pub, options));
	}
	async generateLegacyAddress() {
		return generateLegacyAddress((await this.get('primaryKeypair')).publicKey, (await this.get('trapdoorKeypair')).publicKey);
	}
	/**
	 * Derive public key from private key using ed25519.
	 * @returns {Buffer} The derived public key buffer.
	 */
	getPublicKey(privateKey, encoding = 'base64') {
		const priv = (isString(privateKey)) ? bufferExports.Buffer.from(privateKey, encoding) : privateKey;
		const pub = ed25519.getPublicKey(priv);
		return bufferExports.Buffer.from(pub);
	}
	// TODO: REWRITE THIS TO NEW FORMAT USE ASSIGNED KEYPAIRS INSTEAD OF GENERATING NEW ONES EACH TIME
	async signTransaction(fromAddress, toAddress, amount, privateKey) {
		const from = (isString(fromAddress)) ? fromAddress : bufferExports.Buffer.from(fromAddress).toString('base64');
		const to = (isString(toAddress)) ? toAddress : bufferExports.Buffer.from(toAddress).toString('base64');
		const amountStr = (isBigInt(amount)) ? amount.toString() : String(amount);
		const transactionData = {
			from,
			to,
			amount: amountStr,
		};
		const encoded = await encode(transactionData);
		const msg = bufferExports.Buffer.from(encoded);
		const priv = bufferExports.Buffer.from(privateKey);
		const sig = await ed25519.sign(msg, priv);
		return bufferExports.Buffer.from(sig);
	}
	// High-level helper: pull the active wallet's primary keypair, derive the
	// from-address, sign over the canonical (from, to, amount) struct, and post
	// to /api/transactions. Returns the server's transaction record.
	async sendTransaction(toAddress, amount, options = {}) {
		const primaryKeypair = await this.get('primaryKeypair');
		if (!primaryKeypair?.privateKey || !primaryKeypair?.publicKey) {
			throw new Error('No wallet loaded. Create or import a wallet before sending.');
		}
		const fromAddress = await this.generateLegacyAddress();
		const fromBase64 = bufferExports.Buffer.from(fromAddress).toString('base64');
		const toBase64 = isString(toAddress) ? toAddress : bufferExports.Buffer.from(toAddress).toString('base64');
		const amountStr = (isBigInt(amount)) ? amount.toString() : String(amount);
		const signature = await this.signTransaction(fromBase64, toBase64, amountStr, primaryKeypair.privateKey);
		const payload = {
			from: fromBase64,
			to: toBase64,
			amount: amountStr,
			signature: bufferExports.Buffer.from(signature).toString('base64'),
		};
		// First send always carries the public key so the server can verify and,
		// if needed, create the account record.
		if (options.includePublicKey !== false) {
			payload.publicKey = bufferExports.Buffer.from(primaryKeypair.publicKey).toString('base64');
		}
		return this.createTransaction(payload);
	}
}
extendClass(VIATClientSDK, webAPI);
extendClass(VIATClientSDK, walletPersistence);
const QR_OUTPUT_KEY = 'type';
const DEFAULT_QR_OPTIONS = {
	margin: 1,
	errorCorrectionLevel: 'M',
};
DEFAULT_QR_OPTIONS[QR_OUTPUT_KEY] = 'svg';
async function toQrSvg(text, options = {}) {
	if (!text) {
		return '';
	}
	const merged = {
		...DEFAULT_QR_OPTIONS,
		...options,
	};
	merged[QR_OUTPUT_KEY] = 'svg';
	return QRCode.toString(String(text), merged);
}
VIATClientSDK.toQrSvg = toQrSvg;
VIATClientSDK.prototype.toQrSvg = function instanceToQrSvg(text, options) {
	return toQrSvg(text, options);
};

var Buffer$1 = bufferExports.Buffer;
export { Buffer$1 as Buffer, VIATClientSDK, decode, VIATClientSDK as default, encode, toQrSvg };
//# sourceMappingURL=viat-client-sdk-bundle.js.map
