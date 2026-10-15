describe('EventBus', function () {
  var EventBus, $rootScope, SAM_EVENTS;
  beforeEach(module('sam'));
  beforeEach(inject(function (_EventBus_, _$rootScope_, _SAM_EVENTS_) { EventBus = _EventBus_; $rootScope = _$rootScope_; SAM_EVENTS = _SAM_EVENTS_; }));

  it('broadcasts on $rootScope and delivers the payload', function () {
    var got;
    var off = EventBus.subscribe(SAM_EVENTS.IED_SELECTED, function (p) { got = p; });
    EventBus.publish(SAM_EVENTS.IED_SELECTED, { id: 4 });
    expect(got).toEqual({ id: 4 });
    off();
    EventBus.publish(SAM_EVENTS.IED_SELECTED, { id: 5 });
    expect(got).toEqual({ id: 4 });
  });
  it('toast events carry an increasing id', function () {
    var ids = [];
    $rootScope.$on(SAM_EVENTS.TOAST, function (e, t) { ids.push(t.id); });
    EventBus.toast('info', 'a', 'b');
    EventBus.toast('error', 'c', 'd');
    expect(ids[1]).toBeGreaterThan(ids[0]);
  });
});
