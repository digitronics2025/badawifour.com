const remoteProductImage = (model, id) => ({
  src: `https://digitronics.ma/r2/products/${model}/${id}.webp.w1080.webp`,
  width: 1080,
  height: 1080,
  srcset: [
    [256, `https://digitronics.ma/r2/products/${model}/${id}.webp.w256.webp`],
    [384, `https://digitronics.ma/r2/products/${model}/${id}.webp.w384.webp`],
    [640, `https://digitronics.ma/r2/products/${model}/${id}.webp.w640.webp`],
    [828, `https://digitronics.ma/r2/products/${model}/${id}.webp.w828.webp`],
    [1080, `https://digitronics.ma/r2/products/${model}/${id}.webp.w1080.webp`]
  ]
});

const localProductImage = (slug) => ({
  src: `/products/v1/${slug}/${slug}-1122.webp`,
  width: 1122,
  height: 1402,
  srcset: [320,640,960,1122].map((width)=>[width,`/products/v1/${slug}/${slug}-${width}.webp`])
});

export const RETAILER = {
  name: 'Digitronics',
  productUrl: 'https://digitronics.ma/fr/produit/badawi-four-bf65inoxp-cuisinere-a-gaz-4-feux',
  whatsapp: {
    number: '212664999733',
    display: '+212 664 999 733',
    url: 'https://wa.me/212664999733'
  },
  address: '30 Rue 9, Lots Smara, Bd Oued Daoura, Lot Haj Fateh, Oulfa, Casablanca',
  mapUrl: 'https://maps.google.com/?cid=ChIJWWqhxYotpg0RJQdUsvwxXBM'
};

const retailerFor = (productUrl) => ({...RETAILER,productUrl});

export const PRODUCTS = [{
  model: 'BF65INOXP',
  slug: 'bf65inoxp',
  category: 'gas-oven',
  widthLabel: '65 cm',
  finish: 'Inox',
  installationIncluded: false,
  physical: {
    widthCm: 65,
    depthCm: 55,
    heightCm: 55,
    netWeightKg: 12
  },
  media: {
    product: [
      remoteProductImage('BF65INOXP','547a2fde-1669-42a2-bc58-edf550c927b7'),
      remoteProductImage('BF65INOXP','f1f2fbcd-8daf-4645-9413-bfad8e496483'),
      remoteProductImage('BF65INOXP','85cf78e6-3920-4db0-9ec6-762f68fecc78')
    ],
    food: [
      'https://digitronics.ma/landing/badawi/badawi-food-roast-chicken.webp',
      'https://digitronics.ma/landing/badawi/badawi-food-oven-roast.webp',
      'https://digitronics.ma/landing/badawi/badawi-food-shared-table.webp'
    ],
    video: 'https://digitronics.ma/landing/badawi/badawi-four-showcase.mp4'
  },
  verifiedFacts: {
    type: {fr:'Four à gaz',en:'Gas oven',ar:'فرن غاز'},
    finish: {fr:'Finition inox',en:'Stainless-steel finish',ar:'لمسة إينوكس'},
    doors: {fr:'Deux portes vitrées en façade',en:'Two glazed front doors',ar:'بابان زجاجيان في الواجهة'},
    controls: {fr:'Commandes regroupées sur le côté droit de la façade',en:'Controls grouped on the right side of the front panel',ar:'أزرار التحكم مجمعة في الجهة اليمنى من الواجهة'},
    dimensions: {fr:'65 × 55 × 55 cm',en:'65 × 55 × 55 cm',ar:'65 × 55 × 55 سم'},
    weight: {fr:'12 kg',en:'12 kg',ar:'12 كغ'}
  },
  retailer: retailerFor('https://digitronics.ma/fr/produit/badawi-four-bf65inoxp-cuisinere-a-gaz-4-feux')
},{
  model: 'BF65CINOX',
  slug: 'bf65cinox',
  category: 'gas-cooker',
  widthLabel: '60 × 60 × 90 cm',
  finish: 'Inox',
  physical: {widthCm:60,depthCm:60,heightCm:90},
  media: {product:[localProductImage('bf65cinox')]},
  content: {
    fr: {
      name:'Cuisinière à gaz BADAWI BF65CINOX 4 feux inox 60 × 60 × 90 cm',
      short:'Cuisinière à gaz BADAWI BF65CINOX à 4 feux, finition inox, dimensions 60 × 60 × 90 cm.',
      description:'La BADAWI BF65CINOX est une cuisinière à gaz à 4 feux avec finition inox. Ses dimensions sont de 60 × 60 × 90 cm (largeur × profondeur × hauteur).',
      metaTitle:'BADAWI BF65CINOX 4 feux inox — Site officiel',
      metaDescription:'Découvrez la cuisinière à gaz BADAWI BF65CINOX à 4 feux, finition inox, aux dimensions vérifiées de 60 × 60 × 90 cm.',
      facts:['4 feux','Finition inox','60 × 60 × 90 cm'],
      factLabels:['Brûleurs','Finition','Dimensions'],
      availability:'Prix, disponibilité et délai confirmés par Digitronics.'
    },
    ar: {
      name:'طباخة غاز BADAWI BF65CINOX بأربع شعلات إينوكس 60 × 60 × 90 سم',
      short:'طباخة غاز BADAWI BF65CINOX بأربع شعلات ولمسة إينوكس، بأبعاد 60 × 60 × 90 سم.',
      description:'BADAWI BF65CINOX هي طباخة غاز بأربع شعلات ولمسة إينوكس. أبعادها 60 × 60 × 90 سم (العرض × العمق × الارتفاع).',
      metaTitle:'طباخة BADAWI BF65CINOX — الموقع الرسمي',
      metaDescription:'اكتشف طباخة الغاز BADAWI BF65CINOX بأربع شعلات ولمسة إينوكس، وبأبعاد موثقة تبلغ 60 × 60 × 90 سم.',
      facts:['4 شعلات','لمسة إينوكس','60 × 60 × 90 سم'],
      factLabels:['الشعلات','التشطيب','الأبعاد'],
      availability:'يؤكد Digitronics السعر والتوفر ومدة التسليم.'
    },
    en: {
      name:'BADAWI BF65CINOX 4-burner gas cooker, inox, 60 × 60 × 90 cm',
      short:'BADAWI BF65CINOX four-burner gas cooker with an inox finish, measuring 60 × 60 × 90 cm.',
      description:'The BADAWI BF65CINOX is a four-burner gas cooker with an inox finish. Its verified dimensions are 60 × 60 × 90 cm (width × depth × height).',
      metaTitle:'BADAWI BF65CINOX 4-burner cooker — Official site',
      metaDescription:'Discover the BADAWI BF65CINOX four-burner gas cooker with an inox finish and verified dimensions of 60 × 60 × 90 cm.',
      facts:['4 burners','Inox finish','60 × 60 × 90 cm'],
      factLabels:['Burners','Finish','Dimensions'],
      availability:'Price, availability and delivery time are confirmed by Digitronics.'
    }
  },
  verifiedFacts: {
    type:{fr:'Cuisinière à gaz',en:'Gas cooker',ar:'طباخة غاز'},
    burners:{fr:'4 feux',en:'4 burners',ar:'4 شعلات'},
    finish:{fr:'Finition inox',en:'Inox finish',ar:'لمسة إينوكس'},
    dimensions:{fr:'60 × 60 × 90 cm',en:'60 × 60 × 90 cm',ar:'60 × 60 × 90 سم'}
  },
  retailer: retailerFor('https://digitronics.ma/fr/produit/badawi-four-cuisiniere-a-gaz-4-feux-65cm')
}];

export const getProduct = (slug) => PRODUCTS.find((product) => product.slug === slug);
