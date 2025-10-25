import type { TemplateItem } from '@/types';

/**
 * Figma/FigJamテンプレート定義
 *
 * URLは実際のFigmaコミュニティテンプレートURLに差し替えてください。
 * 各テンプレートはDuplicate/コピーして使用することを想定しています。
 */
export const TEMPLATES: TemplateItem[] = [
  {
    key: 'kickoff',
    label: 'Kick-off',
    kind: 'figjam',
    url: 'https://www.figma.com/community/file/XXXXX',
    description: 'キックオフミーティング用FigJamテンプレート',
  },
  {
    key: 'ujm',
    label: 'User Journey Map',
    kind: 'figma',
    url: 'https://www.figma.com/community/file/YYYYY',
    description: 'ユーザージャーニーマップ作成用テンプレート',
  },
  {
    key: 'ia',
    label: 'Information Architecture',
    kind: 'figma',
    url: 'https://www.figma.com/community/file/ZZZZZ',
    description: '情報アーキテクチャ設計用テンプレート',
  },
  {
    key: 'tips',
    label: 'FigJam Tips',
    kind: 'figjam',
    url: 'https://www.figma.com/community/file/AAAAA',
    description: 'FigJam活用のためのTipsテンプレート',
  },
];

/**
 * プロジェクト命名規約パターン
 * 形式: [A-Z0-9_-]{3,}-[A-Za-z]+-\d{8}
 * 例: PJ1-Kickoff-20250821
 */
export const PROJECT_NAME_REGEX = /^[A-Z0-9_-]{3,}-[A-Za-z]+-\d{8}$/;
