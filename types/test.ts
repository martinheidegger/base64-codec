import { base64, base64URL, make, PREFERS_NO_PADDING, PREFERS_PADDING } from '@leichtgewicht/base64-codec';
import { Buffer } from 'buffer';

base64.encode('hello'); // $ExpectType Uint8Array
base64.encode('hello', new Uint8Array(0));
base64.encode('hello', new Uint8Array(0), 0);
base64.encode('hello', Buffer.alloc(0)); // $ExpectType Buffer
base64.encode.bytes; // $ExpectType number
base64.decode(new Uint8Array([0])); // $ExpectType string
base64.decode(new Uint8Array([0]), 0);
base64.decode(new Uint8Array([0]), 0, 0);
base64.decode.bytes; // $ExpectType number
base64.encodingLength('hello'); // $ExpectType number
base64.name; // $ExpectType "base64"

base64URL.encode('hello');
make('hello', 'charset', 'padding', PREFERS_PADDING);
make('hello', 'charset', 'padding', PREFERS_NO_PADDING);
