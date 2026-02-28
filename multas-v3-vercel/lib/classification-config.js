/**
 * ============================================================================
 * 12時計分類システム - 判定基準コア設定
 * ============================================================================
 * 
 * このファイルを編集して分類ロジックを調整できます。
 * 
 * 【編集ガイド】
 * 1. AXIS_DESCRIPTION: 2軸の概念説明（AIへの指示）
 * 2. CATEGORY_GROUPS: 4象限のグループ定義
 * 3. CATEGORIES: 12カテゴリの名前と説明
 * 4. generateClassificationPrompt(): 最終的なプロンプト生成
 */

// =============================================================================
// 【編集ポイント1】2軸の概念説明
// =============================================================================
// ここを編集すると、AIの軸判断の基準が変わります

export const AXIS_DESCRIPTION = {
  // 縦軸: 患者との距離（6時↔12時）
  vertical: {
    label: '縦軸(場所)',
    near: '院内(4-8時)',      // 患者に近い、ベッドサイド、直接的
    far: '院外/地域(9-12-1-2時)'  // 患者から遠い、地域、社会、間接的
  },
  // 横軸: スキルの性質（9時↔3時）
  horizontal: {
    label: '横軸(スキル)',
    technical: 'テクニカル/医学的(3時方向)',     // 医師としての専門スキル
    nontechnical: 'ノンテクニカル/一般的(9時方向)'  // 一般的な対人スキル
  }
};

// =============================================================================
// 【編集ポイント2】4象限のカテゴリグループ
// =============================================================================
// 各象限に属するカテゴリと、その説明を定義

export const CATEGORY_GROUPS = {
  // 右上: 院外 × テクニカル
  outsideTechnical: {
    name: '院外・テクニカル寄り',
    categories: [1, 2, 3],
    // ↓ この説明がプロンプトに使われます
    descriptions: [
      '1:医療倫理(インフォームドコンセント,患者の権利,守秘義務)',
      '2:地域医療(地域包括ケア,在宅医療,地域連携)',
      '3:医学知識(病態生理,薬理,診断基準)'
    ]
  },
  // 右下: 院内 × テクニカル
  insideTechnical: {
    name: '院内・テクニカル寄り',
    categories: [4, 5, 6],
    descriptions: [
      '4:診察・手技(身体診察,医療手技,検査手法)',
      '5:問題解決能力(分析力,思考力,判断力)',
      '6:統合的臨床(複数要素を含む臨床対応)'
    ]
  },
  // 左下: 院内 × ノンテクニカル
  insideNontechnical: {
    name: '院内・ノンテクニカル寄り',
    categories: [7, 8],
    descriptions: [
      '7:多職種連携(チーム医療,院内連携)',
      '8:コミュニケーション(傾聴,共感,説明,信頼関係)'
    ]
  },
  // 左上: 院外 × ノンテクニカル
  outsideNontechnical: {
    name: '院外・ノンテクニカル寄り',
    categories: [9, 10, 11, 12],
    descriptions: [
      '9:一般教養(医学以外の知識)',
      '10:保健・福祉(社会的サポート,福祉制度,介護)',
      '11:行政(病院間連携,紹介)',
      '12:社会医学/公衆衛生(地域保健,予防医学)'
    ]
  }
};

// =============================================================================
// 【編集ポイント3】12カテゴリの定義
// =============================================================================

export const CATEGORIES = {
  1:  { name: '医療倫理',           shortName: '倫理',   description: 'インフォームドコンセント、患者の権利、守秘義務' },
  2:  { name: '地域医療',           shortName: '地域',   description: '地域包括ケア、在宅医療、地域連携' },
  3:  { name: '医学知識',           shortName: '知識',   description: '病態生理、薬理、診断基準' },
  4:  { name: '診察・手技',         shortName: '手技',   description: '身体診察、医療手技、検査手法' },
  5:  { name: '問題解決能力',       shortName: '推論',   description: '分析力、思考力、判断力' },
  6:  { name: '統合的臨床',         shortName: '統合',   description: '複数要素を含む臨床対応' },
  7:  { name: '多職種連携',         shortName: '連携',   description: 'チーム医療、院内連携' },
  8:  { name: 'コミュニケーション', shortName: 'コミュ', description: '傾聴、共感、説明、信頼関係' },
  9:  { name: '一般教養',           shortName: '教養',   description: '医学以外の知識' },
  10: { name: '保健・福祉',         shortName: '福祉',   description: '社会的サポート、福祉制度、介護' },
  11: { name: '行政',               shortName: '行政',   description: '病院間連携、紹介' },
  12: { name: '社会医学/公衆衛生',  shortName: '公衆',   description: '地域保健、予防医学' }
};

// =============================================================================
// 【編集ポイント4】プロンプト生成
// =============================================================================
// 上記の設定を組み合わせて最終的なプロンプトを生成

/**
 * 分類用プロンプトを生成
 * @param {string} text - 分類対象のテキスト
 * @param {number} maxTextLength - テキストの最大長
 * @returns {string}
 */
export function generateClassificationPrompt(text, maxTextLength = 200) {
  // 2軸の説明を組み立て
  const axisSection = `【分類の2軸】
${AXIS_DESCRIPTION.vertical.label}: ${AXIS_DESCRIPTION.vertical.near} vs ${AXIS_DESCRIPTION.vertical.far}
${AXIS_DESCRIPTION.horizontal.label}: ${AXIS_DESCRIPTION.horizontal.technical} vs ${AXIS_DESCRIPTION.horizontal.nontechnical}`;

  // カテゴリグループの説明を組み立て
  const groupSection = Object.values(CATEGORY_GROUPS)
    .map(group => `${group.name}:\n${group.descriptions.join('\n')}`)
    .join('\n\n');

  // 最終プロンプト
  return `医学生の地域医療実習体験を12時計カテゴリに分類。番号のみ回答。

${axisSection}

【12カテゴリ】
${groupSection}

体験:${text.substring(0, maxTextLength)}
番号:`;
}

// =============================================================================
// ユーティリティ関数（変更不要）
// =============================================================================

export function getCategoryName(categoryId) {
  return CATEGORIES[categoryId]?.name || '不明';
}

export function getCategoryShortName(categoryId) {
  return CATEGORIES[categoryId]?.shortName || '?';
}

export function getCategoryDescription(categoryId) {
  return CATEGORIES[categoryId]?.description || '';
}

export function getAllCategories() {
  return Object.entries(CATEGORIES).map(([id, cat]) => ({
    id: parseInt(id),
    ...cat
  }));
}

// デバッグ用: 現在のプロンプトを確認
export function debugShowPrompt(sampleText = 'テスト') {
  console.log('=== 現在のプロンプト ===\n');
  console.log(generateClassificationPrompt(sampleText));
}
