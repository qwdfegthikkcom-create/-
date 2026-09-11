export type MenuItem = {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
}

export type Category = {
  id: string
  label: string
  icon: string
}

export const categories: Category[] = [
  { id: 'grills', label: 'مشاوي', icon: '🔥' },
  { id: 'appetizers', label: 'مقبلات', icon: '🥗' },
  { id: 'desserts', label: 'حلويات', icon: '🍰' },
  { id: 'drinks', label: 'مشروبات', icon: '🥤' },
]

// ملاحظة: ضع صورة حقيقية لكل صنف بنفس الاسم داخل public/images/items/
// مثال: public/images/items/kebab-mosuli.jpg
// إذا الصورة غير موجودة تظهر بطاقة بديلة بلون وأيقونة الصنف بدل ما تنكسر الصفحة.
export const menuItems: MenuItem[] = [
  {
    id: 'kebab-mosuli',
    name: 'كباب موصلي',
    description: 'لحم غنم مفروم مع بهارات موصلية خاصة، يُشوى على الفحم',
    price: 15000,
    image: '/images/items/kebab-mosuli.jpg',
    category: 'grills',
  },
  {
    id: 'tikka-dajaj',
    name: 'تكة دجاج',
    description: 'صدور دجاج متبلة ومشوية على الفحم',
    price: 12000,
    image: '/images/items/tikka-dajaj.jpg',
    category: 'grills',
  },
  {
    id: 'kebab-arabi',
    name: 'كباب عربي',
    description: 'كفتة مشوية مع طماطة وبصل، تقدم مع الخبز',
    price: 14000,
    image: '/images/items/kebab-arabi.jpg',
    category: 'grills',
  },
  {
    id: 'dolma',
    name: 'دولمة',
    description: 'ورق عنب وخضار محشية بالرز واللحم على الطريقة الموصلية',
    price: 10000,
    image: '/images/items/dolma.jpg',
    category: 'appetizers',
  },
  {
    id: 'hummus',
    name: 'حمص',
    description: 'حمص كريمي بزيت الزيتون والصنوبر، يقدم مع خبز طازج',
    price: 6000,
    image: '/images/items/hummus.jpg',
    category: 'appetizers',
  },
  {
    id: 'kunafa',
    name: 'كنافة',
    description: 'كنافة ساخنة بجبنة وقطر، مزينة بالفستق',
    price: 8000,
    image: '/images/items/kunafa.jpg',
    category: 'desserts',
  },
  {
    id: 'baklawa',
    name: 'بقلاوة',
    description: 'طبقات عجين هشة محشية بالفستق وعسل',
    price: 7000,
    image: '/images/items/baklawa.jpg',
    category: 'desserts',
  },
  {
    id: 'muhallabia',
    name: 'مهلبية',
    description: 'حلوى حليب كريمية مزينة بالفستق وماء الورد',
    price: 5000,
    image: '/images/items/muhallabia.jpg',
    category: 'desserts',
  },
  {
    id: 'lemon-mint',
    name: 'عصير ليمون بالنعناع',
    description: 'عصير ليمون طازج مع نعناع وثلج',
    price: 4000,
    image: '/images/items/lemon-mint.jpg',
    category: 'drinks',
  },
  {
    id: 'chai',
    name: 'چاي عراقي',
    description: 'چاي عراقي أصيل بكاسة مزيرة',
    price: 2000,
    image: '/images/items/chai.jpg',
    category: 'drinks',
  },
]

export const TABLE_COUNT = 20
