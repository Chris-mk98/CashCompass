const KEYWORD_MAP: Record<string, string[]> = {
  식비: [
    "스타벅스", "맥도날드", "배달의민족", "요기요", "쿠팡이츠",
    "버거킹", "subway", "starbucks", "mcdonald", "식당", "카페",
    "커피", "치킨", "피자", "편의점", "CU", "GS25", "세븐일레븐",
    "이마트24", "베이커리", "빵집", "떡볶이", "김밥",
  ],
  교통: [
    "택시", "카카오택시", "우버", "uber", "주유", "주차", "고속도로",
    "톨게이트", "버스", "지하철", "교통카드", "T-money", "코레일",
    "KTX", "SRT",
  ],
  쇼핑: [
    "쿠팡", "네이버쇼핑", "11번가", "G마켓", "옥션", "아마존",
    "amazon", "무신사", "올리브영", "다이소", "이케아", "IKEA",
    "유니클로", "ZARA",
  ],
  주거: [
    "월세", "관리비", "전기", "가스", "수도", "인터넷", "통신",
    "SKT", "KT", "LGU+",
  ],
  의료: [
    "병원", "약국", "의원", "치과", "안과", "피부과", "pharmacy",
    "hospital",
  ],
  문화: [
    "CGV", "롯데시네마", "메가박스", "넷플릭스", "netflix",
    "유튜브", "youtube", "spotify", "멜론", "왓챠",
    "디즈니", "disney",
  ],
  교육: [
    "학원", "교재", "인강", "클래스101", "udemy", "교육",
  ],
};

export function matchCategory(
  description: string,
  userCategories: { id: string; name: string }[]
): string | null {
  const lower = description.toLowerCase();

  for (const [categoryName, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        const match = userCategories.find(
          (c) => c.name === categoryName || c.name.includes(categoryName)
        );
        if (match) return match.id;
      }
    }
  }

  return null;
}
