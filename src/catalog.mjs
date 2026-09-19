const productImage = (id) => ({
  src: `https://digitronics.ma/r2/products/BF65INOXP/${id}.webp.w1080.webp`,
  srcset: [
    [256, `https://digitronics.ma/r2/products/BF65INOXP/${id}.webp.w256.webp`],
    [384, `https://digitronics.ma/r2/products/BF65INOXP/${id}.webp.w384.webp`],
    [640, `https://digitronics.ma/r2/products/BF65INOXP/${id}.webp.w640.webp`],
    [828, `https://digitronics.ma/r2/products/BF65INOXP/${id}.webp.w828.webp`],
    [1080, `https://digitronics.ma/r2/products/BF65INOXP/${id}.webp.w1080.webp`]
  ]
});

export const RETAILER = {
  name: 'Digitronics',
  productUrl: 'https://digitronics.ma/fr/produit/badawi-four-bf65inoxp-cuisinere-a-gaz-4-feux',
  phone: '212664999733',
  phoneDisplay: '+212 664 999 733',
  address: '30 Rue 9, Lots Smara, Bd Oued Daoura, Lot Haj Fateh, Oulfa, Casablanca',
  mapUrl: 'https://maps.google.com/?cid=ChIJWWqhxYotpg0RJQdUsvwxXBM'
};

export const PRODUCTS = [{
  model: 'BF65INOXP',
  slug: 'bf65inoxp',
  category: 'gas-oven',
  widthLabel: '65 cm',
  finish: 'Inox',
  warrantyMonths: 12,
  installationIncluded: false,
  media: {
    product: [
      productImage('547a2fde-1669-42a2-bc58-edf550c927b7'),
      productImage('f1f2fbcd-8daf-4645-9413-bfad8e496483'),
      productImage('85cf78e6-3920-4db0-9ec6-762f68fecc78')
    ],
    food: [
      'https://digitronics.ma/landing/badawi/badawi-food-roast-chicken.webp',
      'https://digitronics.ma/landing/badawi/badawi-food-oven-roast.webp',
      'https://digitronics.ma/landing/badawi/badawi-food-shared-table.webp'
    ],
    video: 'https://digitronics.ma/landing/badawi/badawi-four-showcase.mp4'
  },
  verifiedFacts: {
    type: {
      fr: 'Four à gaz',
      en: 'Gas oven',
      ar: 'فرن غاز'
    },
    finish: {
      fr: 'Finition inox',
      en: 'Stainless-steel finish',
      ar: 'لمسة إينوكس'
    },
    doors: {
      fr: 'Deux portes vitrées en façade',
      en: 'Two glazed front doors',
      ar: 'بابان زجاجيان في الواجهة'
    },
    controls: {
      fr: 'Commandes regroupées sur le côté droit de la façade',
      en: 'Controls grouped on the right side of the front panel',
      ar: 'أزرار التحكم مجمعة في الجهة اليمنى من الواجهة'
    }
  },
  retailer: RETAILER
}];

export const getProduct = (slug) => PRODUCTS.find((product) => product.slug === slug);
