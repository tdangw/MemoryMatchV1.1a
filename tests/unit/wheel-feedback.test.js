import test from 'node:test';
import assert from 'node:assert/strict';
import {committedWheelRewardsForTransition as collect} from '../../js/liveops/rewardFeedbackModel.js';
test('wheel feedback only acknowledges an actual newly applied reward',()=>{
 for(const result of [{},{wheelApplied:false,wheelReward:{kind:'coins',coins:100}},{wheelApplied:false,spin:{coins:25}}])assert.deepEqual(collect(result),[]);
});
test('wheel coins use the actual wheel reward and exclude reconciliation totals',()=>{
 assert.deepEqual(collect({wheelApplied:true,wheelReward:{kind:'coins',coins:5},coins:55,receipts:[{coins:50},{coins:5}]}),[{kind:'coins',amount:5}]);
 assert.deepEqual(collect({wheelApplied:true,wheelReward:null,spin:{coins:25}}),[{kind:'coins',amount:25}]);
});
test('wheel items and supports retain exact entitlement and game identity',()=>{
 assert.deepEqual(collect({wheelApplied:true,wheelReward:{kind:'item',itemId:'link-theme-floral'}}),[{kind:'item',itemId:'link-theme-floral',amount:1}]);
 assert.deepEqual(collect({wheelApplied:true,wheelReward:{kind:'support',gameId:'triple-connect',key:'undo'}}),[{kind:'support',gameId:'triple-connect',key:'undo',amount:1}]);
});
