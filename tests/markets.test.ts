import {test} from 'node:test';
import assert from 'node:assert/strict';
import {displayMoney} from '../src/lib/markets';
test('display money supports zero and two decimal currencies',()=>{assert.equal(displayMoney(1999,'JPY',2,'ja-JP'),'￥40');assert.equal(displayMoney(1999,'USD',1,'en-US'),'$19.99');});
