export type Language = "en" | "hi" | "mr";

export interface Translations {
  appName: string;
  storeSubtitle: string;
  tabs: {
    home: string;
    sales: string;
    stock: string;
    customers: string;
    copilot: string;
    finance: string;
    marketing: string;
    settings: string;
  };
  home: {
    greetingMorning: string;
    greetingAfternoon: string;
    greetingEvening: string;
    todaySales: string;
    vsYesterday: string;
    profitEst: string;
    margin: string;
    sevenDayTrend: string;
    topProducts: string;
    recommendationsHero: string;
    quickActions: string;
    restockAction: string;
    sendOfferAction: string;
    viewReportAction: string;
    askCopilotAction: string;
    upiShare: string;
    itemsLowStock: string;
  };
  sales: {
    title: string;
    week: string;
    month: string;
    totalRevenue: string;
    transactions: string;
    avgOrder: string;
    salesTrend: string;
    categories: string;
    peakHours: string;
    bestDay: string;
    worstDay: string;
  };
  stock: {
    title: string;
    searchPlaceholder: string;
    all: string;
    lowStock: string;
    okStock: string;
    reorderLevel: string;
    currentStock: string;
    forecast7d: string;
    suggestedReorder: string;
    urgentBanner: string;
  };
  customers: {
    title: string;
    regular: string;
    occasional: string;
    atRisk: string;
    totalSpend: string;
    visits: string;
    lastSeen: string;
    sendOffer: string;
    churnRiskTag: string;
  };
  marketing: {
    title: string;
    selectSegment: string;
    selectGoal: string;
    selectLanguage: string;
    generateBtn: string;
    copyBtn: string;
    copied: string;
    sendWhatsapp: string;
  };
  finance: {
    title: string;
    revenue: string;
    cogs: string;
    grossProfit: string;
    expenses: string;
    netProfit: string;
    explainBtn: string;
    readAloud: string;
  };
  copilot: {
    title: string;
    placeholder: string;
    listening: string;
    speakPrompt: string;
    toolsBadge: string;
  };
  settings: {
    title: string;
    plan: string;
    dataSource: string;
    privacy: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: "Paytm VentureAI",
    storeSubtitle: "Kirana Business Copilot",
    tabs: {
      home: "Home",
      sales: "Sales",
      stock: "Stock",
      customers: "Customers",
      copilot: "Copilot",
      finance: "Finance",
      marketing: "Marketing",
      settings: "Settings",
    },
    home: {
      greetingMorning: "Good Morning",
      greetingAfternoon: "Good Afternoon",
      greetingEvening: "Good Evening",
      todaySales: "Today's Sales",
      vsYesterday: "vs yesterday",
      profitEst: "Est. Profit",
      margin: "Gross Margin",
      sevenDayTrend: "7-Day Sales Trend",
      topProducts: "Top Selling Items (30 Days)",
      recommendationsHero: "Today's Recommendations",
      quickActions: "Quick Actions",
      restockAction: "Restock Items",
      sendOfferAction: "Win-back Offer",
      viewReportAction: "Sales Report",
      askCopilotAction: "Ask Copilot",
      upiShare: "UPI Share",
      itemsLowStock: "items low on stock",
    },
    sales: {
      title: "Sales Analytics",
      week: "Last 7 Days",
      month: "Last 30 Days",
      totalRevenue: "Total Revenue",
      transactions: "Total Receipts",
      avgOrder: "Avg Order Value",
      salesTrend: "Daily Sales Curve",
      categories: "Category Breakdown",
      peakHours: "Store Footfall & Peak Hours",
      bestDay: "Peak Sales Day",
      worstDay: "Lowest Sales Day",
    },
    stock: {
      title: "Inventory & Stock",
      searchPlaceholder: "Search kirana items...",
      all: "All Items",
      lowStock: "Low Stock",
      okStock: "Adequate",
      reorderLevel: "Reorder At",
      currentStock: "In Stock",
      forecast7d: "7-Day Predicted Demand",
      suggestedReorder: "Suggested Restock",
      urgentBanner: "items need immediate restocking before weekend",
    },
    customers: {
      title: "Customer Intelligence",
      regular: "Regulars",
      occasional: "Occasional",
      atRisk: "At Churn Risk",
      totalSpend: "Total Spend",
      visits: "Visits",
      lastSeen: "Last Seen",
      sendOffer: "Send WhatsApp Offer",
      churnRiskTag: "No visits in 21 days",
    },
    marketing: {
      title: "WhatsApp Offer Generator",
      selectSegment: "Target Customer Segment",
      selectGoal: "Campaign Goal",
      selectLanguage: "Message Language",
      generateBtn: "Generate 3 WhatsApp Messages",
      copyBtn: "Copy Text",
      copied: "Copied!",
      sendWhatsapp: "Share on WhatsApp",
    },
    finance: {
      title: "Finance & Profitability",
      revenue: "Gross Revenue",
      cogs: "Product Cost (COGS)",
      grossProfit: "Gross Profit",
      expenses: "Operating Expenses",
      netProfit: "Net Take-Home Profit",
      explainBtn: "Explain in Simple Words",
      readAloud: "Read Explanation Aloud",
    },
    copilot: {
      title: "VentureAI Copilot",
      placeholder: "Ask in English, Hindi, or Marathi...",
      listening: "Listening to your voice...",
      speakPrompt: "Hold mic or tap to ask",
      toolsBadge: "Verified with live store data",
    },
    settings: {
      title: "Store Settings & Plan",
      plan: "Subscription Plan",
      dataSource: "Data Connection",
      privacy: "Merchant Privacy & Consent",
    },
  },
  hi: {
    appName: "पेटीएम वेंचरAI",
    storeSubtitle: "किराना व्यापार साथी",
    tabs: {
      home: "होम",
      sales: "बिक्री",
      stock: "स्टॉक",
      customers: "ग्राहक",
      copilot: "कोपायलट",
      finance: "मुनाफा",
      marketing: "प्रचार",
      settings: "सेटिंग्स",
    },
    home: {
      greetingMorning: "शुभ प्रभात",
      greetingAfternoon: "शुभ दोपहर",
      greetingEvening: "शुभ संध्या",
      todaySales: "आज की कुल बिक्री",
      vsYesterday: "कल की तुलना में",
      profitEst: "अनुमानित मुनाफा",
      margin: "मार्जिन",
      sevenDayTrend: "पिछले 7 दिनों का रुझान",
      topProducts: "सबसे ज़्यादा बिकने वाला सामान",
      recommendationsHero: "आज के मुख्य सुझाव",
      quickActions: "त्वरित कार्य",
      restockAction: "स्टॉक मंगवाएं",
      sendOfferAction: "ऑफर भेजें",
      viewReportAction: "बिक्री रिपोर्ट",
      askCopilotAction: "AI से पूछें",
      upiShare: "UPI हिस्सेदारी",
      itemsLowStock: "सामानों का स्टॉक कम है",
    },
    sales: {
      title: "बिक्री विश्लेषण",
      week: "पिछले 7 दिन",
      month: "पिछले 30 दिन",
      totalRevenue: "कुल कमाई",
      transactions: "कुल रसीदें",
      avgOrder: "औसत पर्ची मूल्य",
      salesTrend: "दैनिक बिक्री चार्ट",
      categories: "श्रेणी अनुसार बिक्री",
      peakHours: "दुकान में सबसे ज्यादा भीड़ का समय",
      bestDay: "सबसे अच्छी बिक्री का दिन",
      worstDay: "सबसे कम बिक्री का दिन",
    },
    stock: {
      title: "स्टॉक और इन्वेंटरी",
      searchPlaceholder: "सामान खोजें...",
      all: "सभी सामान",
      lowStock: "कम स्टॉक",
      okStock: "पर्याप्त",
      reorderLevel: "रीऑर्डर स्तर",
      currentStock: "वर्तमान स्टॉक",
      forecast7d: "7 दिन का मांग अनुमान",
      suggestedReorder: "सुझाया गया ऑर्डर",
      urgentBanner: "सामानों का स्टॉक तुरंत मंगाना आवश्यक है",
    },
    customers: {
      title: "ग्राहक जानकारी",
      regular: "पक्के ग्राहक",
      occasional: "कभी-कभार आने वाले",
      atRisk: "छूटने का खतरा",
      totalSpend: "कुल खरीदारी",
      visits: "कुल फेरे",
      lastSeen: "आखरी दौरा",
      sendOffer: "व्हाट्सएप ऑफर भेजें",
      churnRiskTag: "पिछले 21 दिनों से नहीं आए",
    },
    marketing: {
      title: "व्हाट्सएप ऑफर मेकर",
      selectSegment: "ग्राहक वर्ग चुनें",
      selectGoal: "ऑफर का उद्देश्य",
      selectLanguage: "संदेश की भाषा",
      generateBtn: "3 संदेश तैयार करें",
      copyBtn: "कॉपी करें",
      copied: "कॉपी हो गया!",
      sendWhatsapp: "व्हाट्सएप पर साझा करें",
    },
    finance: {
      title: "आय-व्यय और मुनाफा",
      revenue: "कुल बिक्री",
      cogs: "सामान की खरीद लागत",
      grossProfit: "सकल मुनाफा",
      expenses: "दुकान के खर्चे (किराया, बिजली, वेतन)",
      netProfit: "शुद्ध बचत",
      explainBtn: "सरल शब्दों में समझें",
      readAloud: "आवाज़ में सुनें",
    },
    copilot: {
      title: "वेंचरAI कोपायलट",
      placeholder: "हिंदी, इंग्लिश या मराठी में पूछें...",
      listening: "आपकी आवाज़ सुन रहे हैं...",
      speakPrompt: "माइक दबाकर बोलें",
      toolsBadge: "सटीक डेटा द्वारा सत्यापित",
    },
    settings: {
      title: "सेटिंग्स और प्लान",
      plan: "प्लान विवरण",
      dataSource: "डेटा स्रोत",
      privacy: "डेटा सुरक्षा और प्राइवेसी",
    },
  },
  mr: {
    appName: "पेटीएम व्हेंचरAI",
    storeSubtitle: "किराणा व्यवसाय सहाय्यक",
    tabs: {
      home: "मुख्य",
      sales: "विक्री",
      stock: "साठा",
      customers: "ग्राहक",
      copilot: "कोपायलट",
      finance: "नफा-तोटा",
      marketing: "प्रचार",
      settings: "सेटिंग्ज",
    },
    home: {
      greetingMorning: "शुभ सकाळ",
      greetingAfternoon: "शुभ दुपार",
      greetingEvening: "शुभ संध्याकाळ",
      todaySales: "आजची एकूण विक्री",
      vsYesterday: "कालच्या तुलनेत",
      profitEst: "अंदाजे नफा",
      margin: "मार्जिन",
      sevenDayTrend: "मागील ७ दिवसांचा कल",
      topProducts: "सर्वाधिक विकला जाणारा माल",
      recommendationsHero: "आजच्या महत्त्वाच्या शिफारसी",
      quickActions: "जलद कृती",
      restockAction: "माल मागवा",
      sendOfferAction: "ऑफर पाठवा",
      viewReportAction: "विक्री अहवाल",
      askCopilotAction: "AI ला विचारा",
      upiShare: "UPI वाटा",
      itemsLowStock: "वस्तूंचा साठा कमी आहे",
    },
    sales: {
      title: "विक्री विश्लेषण",
      week: "मागील ७ दिवस",
      month: "मागील ३० दिवस",
      totalRevenue: "एकूण कमाई",
      transactions: "एकूण पावत्या",
      avgOrder: "सरासरी पावती मूल्य",
      salesTrend: "दैनंदिन विक्री आलेख",
      categories: "प्रवर्गानुसार विक्री",
      peakHours: "दुकानातील गर्दीची वेळ",
      bestDay: "सर्वाधिक विक्रीचा दिवस",
      worstDay: "सर्वात कमी विक्रीचा दिवस",
    },
    stock: {
      title: "साठा व इन्व्हेंटरी",
      searchPlaceholder: "माल शोधा...",
      all: "सर्व वस्तू",
      lowStock: "कमी साठा",
      okStock: "पुरेसा साठा",
      reorderLevel: "पुनः मागवण्याची पातळी",
      currentStock: "शिल्लक साठा",
      forecast7d: "७ दिवसांची मागणी अंदाज",
      suggestedReorder: "सुचवलेली मागणी",
      urgentBanner: "वस्तूंचा साठा ताबडतोब मागवणे गरजेचे आहे",
    },
    customers: {
      title: "ग्राहक विश्लेषण",
      regular: "नियमित ग्राहक",
      occasional: "कधीतरी येणारे",
      atRisk: "दुरावण्याची शक्यता",
      totalSpend: "एकूण खरेदी",
      visits: "एकूण फेऱ्या",
      lastSeen: "शेवटची भेट",
      sendOffer: "व्हॉट्सॲप ऑफर पाठवा",
      churnRiskTag: "गेल्या २१ दिवसांत भेट नाही",
    },
    marketing: {
      title: "व्हॉट्सॲप ऑफर जनरेटर",
      selectSegment: "ग्राहक वर्ग निवडा",
      selectGoal: "मोहिमेचे उद्दिष्ट",
      selectLanguage: "संदेशाची भाषा",
      generateBtn: "३ मेसेज तयार करा",
      copyBtn: "कॉपी करा",
      copied: "कॉपी झाले!",
      sendWhatsapp: "व्हॉट्सॲपवर पाठवा",
    },
    finance: {
      title: "आर्थिक सारांश व नफा",
      revenue: "एकूण विक्री",
      cogs: "माल खरेदी खर्च",
      grossProfit: "स्थूल नफा",
      expenses: "दुकान खर्च (भाडे, वीज, पगार)",
      netProfit: "निव्वळ बचत",
      explainBtn: "सोप्या शब्दात सांगा",
      readAloud: "आवाजात ऐका",
    },
    copilot: {
      title: "व्हेंचरAI कोपायलट",
      placeholder: "मराठी, हिंदी किंवा इंग्रजीत विचारा...",
      listening: "तुमचा आवाज ऐकत आहे...",
      speakPrompt: "माइक दाबून बोला",
      toolsBadge: "थेट दुकानाच्या आकडेवारीवर आधारित",
    },
    settings: {
      title: "सेटिंग्ज व प्लॅन",
      plan: "प्लॅन माहिती",
      dataSource: "माहिती स्रोत",
      privacy: "डेटा सुरक्षा",
    },
  },
};
