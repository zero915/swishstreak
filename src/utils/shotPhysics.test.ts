import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createBallState, stepBallPhysics } from './ballPhysics';
import { getHoopGeometry } from './hoopGeometry';
import { getAssistStrength, getScoringCylinder, isInScoringCylinder, tryScoreOnDescent } from './scoringCylinder';

describe('shot physics', () => {
  it('starts in ascending phase', () => {
    const state = createBallState(200, 600, 0, -800);
    assert.equal(state.phase, 'ascending');
    assert.equal(state.rimContactCount, 0);
  });

  it('transitions to descending after apex', () => {
    const hoopY = 320;
    const geo = getHoopGeometry(200, hoopY, 118);
    const snapshot = { geo, vx: 0, vy: 0 };
    let state = createBallState(200, 600, 0, -900);

    for (let i = 0; i < 200; i += 1) {
      const result = stepBallPhysics(state, 1 / 60, snapshot, 40, 700, hoopY, {
        wind: 0,
        assistFactor: 1,
      });
      state = result.state;
      if (state.phase === 'descending') break;
    }

    assert.equal(state.phase, 'descending');
  });

  it('ignores rim collisions while ascending', () => {
    const hoopY = 320;
    const geo = getHoopGeometry(200, hoopY, 118);
    const snapshot = { geo, vx: 0, vy: 0 };
    const state = createBallState(geo.rimCenterX, geo.rimBottom + 80, 0, -600);

    const { events } = stepBallPhysics(state, 1 / 120, snapshot, 40, 700, hoopY, { wind: 0 });
    assert.equal(events.some((e) => e.type === 'rim_bounce'), false);
  });

  it('registers make when crossing rim lip inside score funnel', () => {
    const hoopY = 320;
    const geo = getHoopGeometry(200, hoopY, 118);
    const cylinder = getScoringCylinder(geo);

    const made = tryScoreOnDescent({
      geo,
      cylinder,
      ballRadius: 40,
      x: geo.rimCenterX,
      y: geo.rimTop + 22,
      vy: 120,
      prevY: geo.rimTop + 4,
      launchY: 700,
      hoopY,
      peakY: geo.rimTop - 50,
      rimContactCount: 0,
      touchedBackboard: false,
      inScoreFunnel: true,
    });

    assert.equal(made, true);
  });

  it('registers rimmed make when ball center is in the ring after a rim bounce', () => {
    const hoopY = 320;
    const geo = getHoopGeometry(200, hoopY, 118);
    const cylinder = getScoringCylinder(geo);

    const made = tryScoreOnDescent({
      geo,
      cylinder,
      ballRadius: 40,
      x: geo.rimCenterX + 2,
      y: geo.rimTop + 18,
      vy: 90,
      prevY: geo.rimTop + 6,
      launchY: 700,
      hoopY,
      peakY: geo.rimTop - 40,
      rimContactCount: 1,
      touchedBackboard: false,
      inScoreFunnel: true,
    });

    assert.equal(made, true);
  });

  it('registers make when ball center is in the middle of the ring', () => {
    const hoopY = 320;
    const geo = getHoopGeometry(200, hoopY, 118);
    const cylinder = getScoringCylinder(geo);

    const made = tryScoreOnDescent({
      geo,
      cylinder,
      ballRadius: 40,
      x: geo.rimCenterX,
      y: geo.rimTop + 10,
      vy: 80,
      prevY: geo.rimTop - 2,
      launchY: 700,
      hoopY,
      peakY: geo.rimTop - 30,
      rimContactCount: 0,
      touchedBackboard: false,
      inScoreFunnel: false,
    });

    assert.equal(made, true);
  });

  it('registers rimmed roll-in when ball creeps toward center after rim bounce', () => {
    const hoopY = 320;
    const geo = getHoopGeometry(200, hoopY, 118);
    const cylinder = getScoringCylinder(geo);

    const made = tryScoreOnDescent({
      geo,
      cylinder,
      ballRadius: 40,
      x: geo.rimCenterX + 10,
      y: geo.rimTop + 16,
      vy: 45,
      prevY: geo.rimTop + 8,
      launchY: 700,
      hoopY,
      peakY: geo.rimTop - 35,
      rimContactCount: 1,
      touchedBackboard: false,
      inScoreFunnel: true,
    });

    assert.equal(made, true);
  });

  it('registers centered swish lane on descent through the ring', () => {
    const hoopY = 320;
    const geo = getHoopGeometry(200, hoopY, 118);
    const cylinder = getScoringCylinder(geo);

    const made = tryScoreOnDescent({
      geo,
      cylinder,
      ballRadius: 40,
      x: geo.rimCenterX + 3,
      y: geo.rimTop + 8,
      vy: 110,
      prevY: geo.rimTop - 4,
      launchY: 700,
      hoopY,
      peakY: geo.rimTop - 45,
      rimContactCount: 0,
      touchedBackboard: false,
      inScoreFunnel: false,
    });

    assert.equal(made, true);
  });

  it('rejects make when ball width sticks out past the ring', () => {
    const hoopY = 320;
    const geo = getHoopGeometry(200, hoopY, 118);
    const cylinder = getScoringCylinder(geo);
    const offsetX = geo.rimCenterX + 20;

    const made = tryScoreOnDescent({
      geo,
      cylinder,
      ballRadius: 40,
      x: offsetX,
      y: geo.rimTop + 18,
      vy: 90,
      prevY: geo.rimTop + 4,
      launchY: 700,
      hoopY,
      peakY: geo.rimTop - 40,
      rimContactCount: 0,
      touchedBackboard: false,
      inScoreFunnel: true,
    });

    assert.equal(made, false);
  });

  it('detects scoring cylinder membership at rim height', () => {
    const hoopY = 320;
    const geo = getHoopGeometry(200, hoopY, 118);
    const cylinder = getScoringCylinder(geo);
    assert.equal(isInScoringCylinder(cylinder, geo.rimCenterX, geo.rimTop + 5), true);
  });

  it('ramps assist strength for near misses', () => {
    const inner = 50;
    const center = getAssistStrength(48, inner, 1);
    const far = getAssistStrength(80, inner, 1);
    assert.ok(center > far);
    assert.ok(center > 0);
  });
});
