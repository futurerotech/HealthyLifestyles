/**
 * Reviewed USDA ERS fruit and vegetable price snapshot (public domain, CC0).
 *
 * Values are copied exactly from the ERS "ALL FRUITS" and "ALL VEGETABLES" average-price
 * CSV files, as printed by scripts/data/price-source-inventory.mjs in workflow run
 * 43654292892 (2026-11-15), and reviewed by hand before commit.
 *
 * How this source differs from the BLS snapshot, and why it is kept separate:
 * - It is an ANNUAL national average from Circana retail scanner data, not a monthly
 *   BLS survey price. The CSV carries no year. ERS lists 2023 as its latest scanner year,
 *   and the 2022 tables are archived, so the current files are taken to be 2023. That is
 *   an inference, and it is labeled as one wherever the price is shown.
 * - ERS says the data should not be used to infer price changes over time, so these
 *   prices are NOT inflation-adjusted to 2026. They are shown as 2023 prices and most
 *   likely understate current shelf prices.
 * - `yield` is ERS's preparation yield: the edible share of the purchased weight after
 *   removing inedible parts, cooking loss, or the drained liquid for canned foods. The
 *   portions in ingredient-portions.ts are edible amounts, so cost = price ÷ yield ×
 *   amount. Where a portion is a dry weight (lentils), the yield is 1, because the
 *   purchased weight equals the portion weight.
 * - Only exact food-and-form matches are used. Ambiguous ingredients (bell pepper of any
 *   color, "berries", "mixed vegetables", corn of unknown form) stay unpriced.
 */
export const ERS_SNAPSHOT = {
  source: 'USDA Economic Research Service, Fruit and Vegetable Prices (Circana retail scanner data); public domain (CC0)',
  sourceUrl: 'https://www.ers.usda.gov/data-products/fruit-and-vegetable-prices/',
  files: [
    'https://www.ers.usda.gov/media/6210/all-fruits-average-prices-csv-format.csv?v=63344',
    'https://www.ers.usda.gov/media/6240/all-vegetables-average-prices-csv-format.csv?v=29890',
  ],
  dataYear: 2023,
  dataYearInferred: true,
  retrieved: '2026-11-15',
  /** Items priced from ERS (foods with no current BLS series). Prices per pound as purchased. */
  items: [
    { key: 'ers.apples', ersItem: 'Apples', form: 'Fresh', unit: 'lb', price: 1.86093095, yield: 0.9 },
    { key: 'ers.asparagus', ersItem: 'Asparagus', form: 'Fresh', unit: 'lb', price: 3.212453364, yield: 0.4938 },
    { key: 'ers.avocados', ersItem: 'Avocados', form: 'Fresh', unit: 'lb', price: 2.262402684, yield: 0.7408 },
    { key: 'ers.blackBeansCanned', ersItem: 'Black beans', form: 'Canned', unit: 'lb', price: 1.306312699, yield: 0.65 },
    { key: 'ers.kidneyBeansCanned', ersItem: 'Kidney beans', form: 'Canned', unit: 'lb', price: 1.199920223, yield: 0.65 },
    { key: 'ers.broccoli', ersItem: 'Broccoli heads', form: 'Fresh', unit: 'lb', price: 3.023555459, yield: 0.78 },
    { key: 'ers.carrots', ersItem: 'Carrots, raw whole', form: 'Fresh', unit: 'lb', price: 1.00554135, yield: 0.89 },
    { key: 'ers.cherryTomatoes', ersItem: 'Tomatoes, grape and cherry', form: 'Fresh', unit: 'lb', price: 4.155557011, yield: 0.91 },
    { key: 'ers.cucumber', ersItem: 'Cucumbers with peel', form: 'Fresh', unit: 'lb', price: 1.092848382, yield: 0.97 },
    { key: 'ers.greenBeans', ersItem: 'Green beans', form: 'Fresh', unit: 'lb', price: 2.659189993, yield: 0.8466 },
    { key: 'ers.kale', ersItem: 'Kale', form: 'Fresh', unit: 'lb', price: 3.57112371, yield: 1.05 },
    // Dry weight portion: yield 1 (ERS's 2.4692 is the dry-to-cooked factor and does not apply).
    { key: 'ers.lentilsDry', ersItem: 'Lentils', form: 'Dried', unit: 'lb', price: 1.957697337, yield: 1 },
    { key: 'ers.mushrooms', ersItem: 'Mushrooms, whole', form: 'Fresh', unit: 'lb', price: 4.154521771, yield: 0.97 },
    { key: 'ers.olives', ersItem: 'Olives', form: 'Canned', unit: 'lb', price: 5.989003318, yield: 1 },
    { key: 'ers.onions', ersItem: 'Onions', form: 'Fresh', unit: 'lb', price: 1.062206305, yield: 0.9 },
    { key: 'ers.pineapple', ersItem: 'Pineapple', form: 'Fresh', unit: 'lb', price: 0.668427034, yield: 0.51 },
    { key: 'ers.raisins', ersItem: 'Grapes (raisins)', form: 'Dried', unit: 'lb', price: 4.328343983, yield: 1 },
    { key: 'ers.spinachRaw', ersItem: 'Spinach, eaten raw', form: 'Fresh', unit: 'lb', price: 4.500420718, yield: 1 },
    { key: 'ers.sweetPotatoes', ersItem: 'Sweet potatoes', form: 'Fresh', unit: 'lb', price: 1.164626523, yield: 0.8818 },
    { key: 'ers.zucchini', ersItem: 'Zucchini', form: 'Fresh', unit: 'lb', price: 1.639076186, yield: 0.7695 },
  ],
  /**
   * Preparation yields for foods priced by current BLS series. BLS prices are per
   * purchased pound too, so the same edible-portion correction applies. Only the yield
   * comes from ERS; the price stays BLS.
   */
  yieldsForBls: {
    bananas: { ersItem: 'Bananas', form: 'Fresh', yield: 0.64 },
    potatoes: { ersItem: 'Potatoes', form: 'Fresh', yield: 0.8113 },
    lettuce: { ersItem: 'Lettuce, iceberg', form: 'Fresh', yield: 0.95 },
    romaine: { ersItem: 'Lettuce, romaine, heads', form: 'Fresh', yield: 0.94 },
    tomatoes: { ersItem: 'Tomatoes, large round', form: 'Fresh', yield: 0.91 },
  },
} as const;
