/*
 * This file contains functions to calculate values based on user-inputted values.
 * Function names are based on which values are provided.
 * First argument is always flow rate.
 */
import { Time, Volume, UnitNumber } from './';

// Define units that each number MUST be in before calculation.
const _flowRateUnit = 'uL/sec';
const _totalTimeUnit = 'sec';
const _volumePerFractionUnit = 'uL';
const _totalVolumeUnit = 'uL';
const _numberOfFractionsUnit = null;

// Helper functions
const calculateTotalVolume = (flowRate, totalTime) =>
  new Volume(totalTime.value * flowRate.value, _totalVolumeUnit);
const calculateNumberOfFractions = (totalVolume, volumePerFraction) =>
  new UnitNumber(totalVolume.value / volumePerFraction.value, _numberOfFractionsUnit);
const calculateVolumePerFraction = (totalVolume, numberOfFractions) =>
  new Volume(totalVolume.value / numberOfFractions.value, _volumePerFractionUnit);
const calculateTotalTime = (flowRate, totalVolume) =>
  new Time(totalVolume.value / flowRate.value, _totalTimeUnit);

export function totalTimeVolumePerFraction(
  flowRate, totalTime, volumePerFraction,
  totalVolumeUnit=_totalVolumeUnit, numberOfFractionsUnit=_numberOfFractionsUnit
) {
  const _flowRate = flowRate.convert(_flowRateUnit);
  const _totalTime = totalTime.convert(_totalTimeUnit);
  const _volumePerFraction = volumePerFraction.convert(_volumePerFractionUnit);

  const _totalVolume = calculateTotalVolume(_flowRate, _totalTime);
  const totalVolume = _totalVolume.convert(totalVolumeUnit);
  const numberOfFractions = calculateNumberOfFractions(
    _totalVolume, _volumePerFraction
  ).convert(numberOfFractionsUnit);
  return {totalVolume, numberOfFractions};
}

export function totalTimeNumberOfFractions(
  flowRate, totalTime, numberOfFractions,
  totalVolumeUnit=_totalVolumeUnit, volumePerFractionUnit=_volumePerFractionUnit
) {
  const _flowRate = flowRate.convert(_flowRateUnit);
  const _totalTime = totalTime.convert(_totalTimeUnit);
  const _numberOfFractions = numberOfFractions.convert(_numberOfFractionsUnit);

  const _totalVolume = calculateTotalVolume(_flowRate, _totalTime);
  const totalVolume = _totalVolume.convert(totalVolumeUnit);
  const volumePerFraction = calculateVolumePerFraction(
    _totalVolume, _numberOfFractions
  ).convert(volumePerFractionUnit);
  return {totalVolume, volumePerFraction};
}

export function totalVolumeVolumePerFraction(
  flowRate, totalVolume, volumePerFraction,
  totalTimeUnit=_totalTimeUnit, numberOfFractionsUnit=_numberOfFractionsUnit
) {
  const _flowRate = flowRate.convert(_flowRateUnit);
  const _totalVolume = totalVolume.convert(_totalVolumeUnit);
  const _volumePerFraction = volumePerFraction.convert(_volumePerFractionUnit);

  const totalTime = calculateTotalTime(_flowRate, _totalVolume).convert(totalTimeUnit);
  const numberOfFractions = calculateNumberOfFractions(
    _totalVolume, _volumePerFraction
  ).convert(numberOfFractionsUnit);
  return {totalTime, numberOfFractions};
}

export function totalVolumeNumberOfFractions(
  flowRate, totalVolume, numberOfFractions,
  totalTimeUnit=_totalTimeUnit, volumePerFractionUnit=_volumePerFractionUnit
) {
  const _flowRate = flowRate.convert(_flowRateUnit);
  const _totalVolume = totalVolume.convert(_totalVolumeUnit);
  const _numberOfFractions = numberOfFractions.convert(_numberOfFractionsUnit);

  const totalTime = calculateTotalTime(_flowRate, _totalVolume).convert(totalTimeUnit);
  const volumePerFraction = calculateVolumePerFraction(
    _totalVolume, _numberOfFractions
  ).convert(volumePerFractionUnit);
  return {totalTime, volumePerFraction};
}
