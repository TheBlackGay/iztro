import { getHeavenlyStemAndEarthlyBranchBySolarDate } from 'lunar-lite';
import { getYearly12, initStars } from '.';
import { kot, t } from '../i18n';
import FunctionalStar from './FunctionalStar';
import { getBrightness } from '../utils';
import {
  getDailyStarIndex,
  getLuanXiIndex,
  getMonthlyStarIndex,
  getTimelyStarIndex,
  getYearlyStarIndex,
} from './location';
import { getConfig } from '../astro';
import { AstrolabeParam } from '../data/types';

/**
 * 安杂耀
 *
 * @param {AstrolabeParam} param - 通用排盘参数参数
 * @returns 38杂耀
 */
export const getAdjectiveStar = (param: AstrolabeParam) => {
  const { solarDate, timeIndex, fixLeap } = param;
  const { algorithm } = getConfig();
  const stars = initStars();
  const { yearly } = getHeavenlyStemAndEarthlyBranchBySolarDate(solarDate, timeIndex, {
    year: getConfig().yearDivide,
  });

  const yearlyIndex = getYearlyStarIndex(param);
  const monthlyIndex = getMonthlyStarIndex(solarDate, timeIndex, fixLeap);
  const dailyIndex = getDailyStarIndex(solarDate, timeIndex, fixLeap);
  const timelyIndex = getTimelyStarIndex(timeIndex);
  const { hongluanIndex, tianxiIndex } = getLuanXiIndex(yearly[1]);
  const { suiqian12 } = getYearly12(solarDate);

  stars[hongluanIndex].push(new FunctionalStar({ name: t('hongluan'), type: 'flower', scope: 'origin', brightness: getBrightness(t('hongluan'), hongluanIndex) }));
  stars[tianxiIndex].push(new FunctionalStar({ name: t('tianxi'), type: 'flower', scope: 'origin', brightness: getBrightness(t('tianxi'), tianxiIndex) }));
  stars[monthlyIndex.tianyaoIndex].push(new FunctionalStar({ name: t('tianyao'), type: 'flower', scope: 'origin', brightness: getBrightness(t('tianyao'), monthlyIndex.tianyaoIndex) }));
  stars[yearlyIndex.xianchiIndex].push(new FunctionalStar({ name: t('xianchi'), type: 'flower', scope: 'origin', brightness: getBrightness(t('xianchi'), yearlyIndex.xianchiIndex) }));
  stars[monthlyIndex.yuejieIndex].push(new FunctionalStar({ name: t('jieshen'), type: 'helper', scope: 'origin', brightness: getBrightness(t('jieshen'), monthlyIndex.yuejieIndex) }));
  stars[dailyIndex.santaiIndex].push(new FunctionalStar({ name: t('santai'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('santai'), dailyIndex.santaiIndex) }));
  stars[dailyIndex.bazuoIndex].push(new FunctionalStar({ name: t('bazuo'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('bazuo'), dailyIndex.bazuoIndex) }));
  stars[dailyIndex.enguangIndex].push(new FunctionalStar({ name: t('engguang'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('engguang'), dailyIndex.enguangIndex) }));
  stars[dailyIndex.tianguiIndex].push(new FunctionalStar({ name: t('tiangui'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('tiangui'), dailyIndex.tianguiIndex) }));
  stars[yearlyIndex.longchiIndex].push(new FunctionalStar({ name: t('longchi'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('longchi'), yearlyIndex.longchiIndex) }));
  stars[yearlyIndex.fenggeIndex].push(new FunctionalStar({ name: t('fengge'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('fengge'), yearlyIndex.fenggeIndex) }));
  stars[yearlyIndex.tiancaiIndex].push(new FunctionalStar({ name: t('tiancai'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('tiancai'), yearlyIndex.tiancaiIndex) }));
  stars[yearlyIndex.tianshouIndex].push(
    new FunctionalStar({ name: t('tianshou'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('tianshou'), yearlyIndex.tianshouIndex) }),
  );
  stars[timelyIndex.taifuIndex].push(new FunctionalStar({ name: t('taifu'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('taifu'), timelyIndex.taifuIndex) }));
  stars[timelyIndex.fenggaoIndex].push(new FunctionalStar({ name: t('fenggao'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('fenggao'), timelyIndex.fenggaoIndex) }));
  stars[monthlyIndex.tianwuIndex].push(new FunctionalStar({ name: t('tianwu'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('tianwu'), monthlyIndex.tianwuIndex) }));
  stars[yearlyIndex.huagaiIndex].push(new FunctionalStar({ name: t('huagai'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('huagai'), yearlyIndex.huagaiIndex) }));
  stars[yearlyIndex.tianguanIndex].push(
    new FunctionalStar({ name: t('tianguan'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('tianguan'), yearlyIndex.tianguanIndex) }),
  );
  stars[yearlyIndex.tianfuIndex].push(new FunctionalStar({ name: t('tianfu'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('tianfu'), yearlyIndex.tianfuIndex) }));
  stars[yearlyIndex.tianchuIndex].push(new FunctionalStar({ name: t('tianchu'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('tianchu'), yearlyIndex.tianchuIndex) }));
  stars[monthlyIndex.tianyueIndex].push(new FunctionalStar({ name: t('tianyue'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('tianyue'), monthlyIndex.tianyueIndex) }));
  stars[yearlyIndex.tiandeIndex].push(new FunctionalStar({ name: t('tiande'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('tiande'), yearlyIndex.tiandeIndex) }));
  stars[yearlyIndex.yuedeIndex].push(new FunctionalStar({ name: t('yuede'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('yuede'), yearlyIndex.yuedeIndex) }));
  stars[yearlyIndex.tiankongIndex].push(
    new FunctionalStar({ name: t('tiankong'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('tiankong'), yearlyIndex.tiankongIndex) }),
  );
  stars[yearlyIndex.xunkongIndex].push(new FunctionalStar({ name: t('xunkong'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('xunkong'), yearlyIndex.xunkongIndex) }));

  if (algorithm !== 'zhongzhou') {
    stars[yearlyIndex.jieluIndex].push(new FunctionalStar({ name: t('jielu'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('jielu'), yearlyIndex.jieluIndex) }));
    stars[yearlyIndex.kongwangIndex].push(
      new FunctionalStar({ name: t('kongwang'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('kongwang'), yearlyIndex.kongwangIndex) }),
    );
  } else {
    stars[suiqian12.indexOf(t(kot('longde')))].push(
      new FunctionalStar({ name: t('longde'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('longde'), suiqian12.indexOf(t(kot('longde')))) }),
    );
    stars[yearlyIndex.jiekongIndex].push(
      new FunctionalStar({ name: t('jiekong'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('jiekong'), yearlyIndex.jiekongIndex) }),
    );
    stars[yearlyIndex.jieshaAdjIndex].push(
      new FunctionalStar({ name: t('jieshaAdj'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('jieshaAdj'), yearlyIndex.jieshaAdjIndex) }),
    );
    stars[yearlyIndex.dahaoAdjIndex].push(new FunctionalStar({ name: t('dahao'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('dahao'), yearlyIndex.dahaoAdjIndex) }));
  }

  stars[yearlyIndex.guchenIndex].push(new FunctionalStar({ name: t('guchen'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('guchen'), yearlyIndex.guchenIndex) }));
  stars[yearlyIndex.guasuIndex].push(new FunctionalStar({ name: t('guasu'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('guasu'), yearlyIndex.guasuIndex) }));
  stars[yearlyIndex.feilianIndex].push(new FunctionalStar({ name: t('feilian'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('feilian'), yearlyIndex.feilianIndex) }));
  stars[yearlyIndex.posuiIndex].push(new FunctionalStar({ name: t('posui'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('posui'), yearlyIndex.posuiIndex) }));
  stars[monthlyIndex.tianxingIndex].push(
    new FunctionalStar({ name: t('tianxing'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('tianxing'), monthlyIndex.tianxingIndex) }),
  );
  stars[monthlyIndex.yinshaIndex].push(new FunctionalStar({ name: t('yinsha'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('yinsha'), monthlyIndex.yinshaIndex) }));
  stars[yearlyIndex.tiankuIndex].push(new FunctionalStar({ name: t('tianku'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('tianku'), yearlyIndex.tiankuIndex) }));
  stars[yearlyIndex.tianxuIndex].push(new FunctionalStar({ name: t('tianxu'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('tianxu'), yearlyIndex.tianxuIndex) }));
  stars[yearlyIndex.tianshiIndex].push(new FunctionalStar({ name: t('tianshi'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('tianshi'), yearlyIndex.tianshiIndex) }));
  stars[yearlyIndex.tianshangIndex].push(
    new FunctionalStar({ name: t('tianshang'), type: 'adjective', scope: 'origin', brightness: getBrightness(t('tianshang'), yearlyIndex.tianshangIndex) }),
  );

  stars[yearlyIndex.nianjieIndex].push(new FunctionalStar({ name: t('nianjie'), type: 'helper', scope: 'origin', brightness: getBrightness(t('nianjie'), yearlyIndex.nianjieIndex) }));

  return stars;
};
