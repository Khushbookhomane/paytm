export type Language = "en" | "hi" | "mr";

export interface Translations {
  appName: string;
  tagline: string;
  storeSubtitle: string;
  tabs: {
    overview: string;
    copilot: string;
    intelligence: string;
    sales: string;
    inventory: string;
    customers: string;
    marketing: string;
    finance: string;
    growthScore: string;
    notifications: string;
    reports: string;
    settings: string;
    // Backward compatibility aliases
    home: string;
    stock: string;
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
    appName: "VentureAI",
    tagline: "Your AI Business Partner. Beyond Payments.",
    storeSubtitle: "AI Business Operating System",
    tabs: {
      overview: "Overview",
      copilot: "AI Copilot",
      intelligence: "Business Intelligence",
      sales: "Sales & Transactions",
      inventory: "Inventory Management",
      customers: "Customer Intelligence",
      marketing: "Marketing Assistant",
      finance: "Financial Assistant",
      growthScore: "Growth Score",
      notifications: "Alerts & Notifications",
      reports: "Reports & Exports",
      settings: "Settings",
      home: "Overview",
      stock: "Inventory",
    },
    home: {
      greetingMorning: "Good morning",
      greetingAfternoon: "Good afternoon",
      greetingEvening: "Good evening",
      todaySales: "Today's Sales",
      vsYesterday: "vs yesterday",
      profitEst: "Estimated Profit",
      margin: "Gross Margin",
      sevenDayTrend: "7-Day Sales Performance",
      topProducts: "Top Selling Items (30 Days)",
      recommendationsHero: "AI Business Partner Recommendations",
      quickActions: "Quick Actions",
      restockAction: "Restock Low Items",
      sendOfferAction: "Send Customer Offer",
      viewReportAction: "Executive Report",
      askCopilotAction: "Ask AI Copilot",
      upiShare: "Paytm UPI & Soundbox Share",
      itemsLowStock: "items running low",
    },
    sales: {
      title: "Sales & Transactions",
      week: "Past 7 Days",
      month: "Past 30 Days",
      totalRevenue: "Total Revenue",
      transactions: "Transactions",
      avgOrder: "Avg Transaction Value",
      salesTrend: "Daily Sales Trajectory",
      categories: "Category Revenue Breakdown",
      peakHours: "Peak Business Hours",
      bestDay: "Highest Revenue Day",
      worstDay: "Lowest Revenue Day",
    },
    stock: {
      title: "AI Inventory Management",
      searchPlaceholder: "Search products by name or category...",
      all: "All Items",
      lowStock: "Low Stock Alert",
      okStock: "Adequate Stock",
      reorderLevel: "Reorder Threshold",
      currentStock: "Current Stock",
      forecast7d: "7-Day Forecasted Demand",
      suggestedReorder: "AI Suggested Order",
      urgentBanner: "items critically low before weekend rush",
    },
    customers: {
      title: "Customer Intelligence & Retention",
      regular: "Regular Shoppers",
      occasional: "Occasional Buyers",
      atRisk: "At-Risk / Churning",
      totalSpend: "Total Spend",
      visits: "Total Checkouts",
      lastSeen: "Last Seen",
      sendOffer: "Send WhatsApp Offer",
      churnRiskTag: "Needs Win-Back Campaign",
    },
    marketing: {
      title: "AI Marketing Assistant",
      selectSegment: "Target Customer Segment",
      selectGoal: "Campaign Objective",
      selectLanguage: "Campaign Language",
      generateBtn: "Generate Promotional Messages",
      copyBtn: "Copy Text",
      copied: "Copied!",
      sendWhatsapp: "Dispatch on WhatsApp",
    },
    finance: {
      title: "Financial Intelligence & Cash Flow",
      revenue: "Gross Revenue",
      cogs: "Cost of Goods Sold (COGS)",
      grossProfit: "Verified Gross Profit",
      expenses: "Operating Expenses",
      netProfit: "Estimated Net Profit",
      explainBtn: "Explain Finances with AI",
      readAloud: "Read Voice Brief",
    },
    copilot: {
      title: "AI Business Copilot",
      placeholder: "Ask anything about sales, low stock, marketing or profit in EN/HI/MR...",
      listening: "Listening... speak now in Hindi, Marathi, or English",
      speakPrompt: "Tap mic to speak",
      toolsBadge: "Verified Paytm Store Data",
    },
    settings: {
      title: "Merchant Settings & Integrations",
      plan: "Subscription Plan",
      dataSource: "Connected Paytm Hardware",
      privacy: "Data Governance & Privacy",
    },
  },

  hi: {
    appName: "VentureAI",
    tagline: "आपका AI बिज़नेस पार्टनर। पेमेंट्स से कहीं आगे।",
    storeSubtitle: "AI बिज़नेस ऑपरेटिंग सिस्टम",
    tabs: {
      overview: "ओवरव्यू",
      copilot: "AI कोपायलट",
      intelligence: "बिज़नेस इंटेलिजेंस",
      sales: "बिक्री व लेन-देन",
      inventory: "इन्वेंट्री मैनेजमेंट",
      customers: "ग्राहक इंटेलिजेंस",
      marketing: "मार्केटिंग असिस्टेंट",
      finance: "फाइनेंशियल असिस्टेंट",
      growthScore: "ग्रोथ स्कोर",
      notifications: "अलर्ट व सूचनाएं",
      reports: "रिपोर्ट्स व एक्सपोर्ट",
      settings: "सेटिंग्स",
      home: "ओवरव्यू",
      stock: "इन्वेंट्री",
    },
    home: {
      greetingMorning: "शुभ प्रभात",
      greetingAfternoon: "शुभ दोपहर",
      greetingEvening: "शुभ संध्या",
      todaySales: "आज की कुल बिक्री",
      vsYesterday: "कल की तुलना में",
      profitEst: "अनुमानित मुनाफा",
      margin: "ग्रॉस मार्जिन",
      sevenDayTrend: "पिछले ७ दिनों की बिक्री",
      topProducts: "सबसे ज्यादा बिकने वाला सामान (३० दिन)",
      recommendationsHero: "AI बिज़नेस पार्टनर के मुख्य सुझाव",
      quickActions: "त्वरित कार्य",
      restockAction: "कम स्टॉक मंगाएं",
      sendOfferAction: "ग्राहक ऑफर भेजें",
      viewReportAction: "बिज़नेस रिपोर्ट",
      askCopilotAction: "AI कोपायलट से पूछें",
      upiShare: "पेटीएम साउंडबॉक्स व डिजिटल शेयर",
      itemsLowStock: "सामानों का स्टॉक कम",
    },
    sales: {
      title: "बिक्री और लेन-देन",
      week: "पिछले ७ दिन",
      month: "पिछले ३० दिन",
      totalRevenue: "कुल कमाई",
      transactions: "कुल लेन-देन",
      avgOrder: "औसत बिल (ATV)",
      salesTrend: "दैनिक बिक्री का ग्राफ",
      categories: "कैटेगरी अनुसार बिक्री",
      peakHours: "दुकान में सबसे ज्यादा भीड़ का समय",
      bestDay: "सबसे ज्यादा बिक्री वाला दिन",
      worstDay: "सबसे कम बिक्री वाला दिन",
    },
    stock: {
      title: "AI इन्वेंट्री मैनेजमेंट",
      searchPlaceholder: "प्रोडक्ट का नाम या कैटेगरी खोजें...",
      all: "सभी सामान",
      lowStock: "कम स्टॉक अलर्ट",
      okStock: "पर्याप्त स्टॉक",
      reorderLevel: "न्यूनतम सीमा",
      currentStock: "वर्तमान स्टॉक",
      forecast7d: "७ दिनों की अनुमानित मांग",
      suggestedReorder: "AI द्वारा सुझाया गया ऑर्डर",
      urgentBanner: "सामानों का स्टॉक वीकेंड से पहले खत्म हो सकता है",
    },
    customers: {
      title: "ग्राहक इंटेलिजेंस व रिटेंशन",
      regular: "नियमित ग्राहक",
      occasional: "कभी-कभार आने वाले",
      atRisk: "छूटने का खतरा (At-Risk)",
      totalSpend: "कुल खरीदारी",
      visits: "दुकान आने की संख्या",
      lastSeen: "अंतिम बार आए",
      sendOffer: "व्हाट्सऐप ऑफर भेजें",
      churnRiskTag: "वापस बुलाने की जरूरत",
    },
    marketing: {
      title: "AI मार्केटिंग असिस्टेंट",
      selectSegment: "लक्षित ग्राहक चुनें",
      selectGoal: "कैंपेन का उद्देश्य",
      selectLanguage: "संदेश की भाषा",
      generateBtn: "प्रमोशनल मैसेज बनाएं",
      copyBtn: "कॉपी करें",
      copied: "कॉपी हो गया!",
      sendWhatsapp: "व्हाट्सऐप पर भेजें",
    },
    finance: {
      title: "फाइनेंशियल इंटेलिजेंस व कैश फ्लो",
      revenue: "कुल बिक्री",
      cogs: "सामान की लागत (COGS)",
      grossProfit: "ग्रॉस मुनाफा",
      expenses: "दुकान के खर्चे",
      netProfit: "अनुमानित शुद्ध मुनाफा",
      explainBtn: "AI से वित्तीय विश्लेषण समझें",
      readAloud: "आवाज़ में सुनें",
    },
    copilot: {
      title: "AI बिज़नेस कोपायलट",
      placeholder: "बिक्री, स्टॉक, ग्राहक या मुनाफे के बारे में हिंदी/इंग्लिश में पूछें...",
      listening: "सुन रहे हैं... माइक में बोलें",
      speakPrompt: "माइक दबाकर बोलें",
      toolsBadge: "सत्यापित पेटीएम स्टोर डेटा",
    },
    settings: {
      title: "मर्चेंट सेटिंग्स व इंटीग्रेशन",
      plan: "प्लान",
      dataSource: "जुड़े हुए पेटीएम उपकरण",
      privacy: "डेटा सुरक्षा व गोपनीयता",
    },
  },

  mr: {
    appName: "VentureAI",
    tagline: "तुमचा AI बिझनेस पार्टनर. पेमेंट्सच्या पलीकडे.",
    storeSubtitle: "AI बिझनेस ऑपरेटिंग सिस्टीम",
    tabs: {
      overview: "डॅशबोर्ड",
      copilot: "AI कोपायलट",
      intelligence: "बिझनेस इंटेलिजन्स",
      sales: "विक्री व व्यवहार",
      inventory: "इन्व्हेंटरी व्यवस्थापन",
      customers: "ग्राहक इंटेलिजन्स",
      marketing: "मार्केटिंग सहाय्यक",
      finance: "आर्थिक सहाय्यक",
      growthScore: "ग्रोथ स्कोअर",
      notifications: "सूचना व अलर्ट",
      reports: "अहवाल व निर्यात",
      settings: "सेटिंग्ज",
      home: "डॅशबोर्ड",
      stock: "इन्व्हेंटरी",
    },
    home: {
      greetingMorning: "शुभ प्रभात",
      greetingAfternoon: "शुभ दुपार",
      greetingEvening: "शुभ संध्याकाळ",
      todaySales: "आजची एकूण विक्री",
      vsYesterday: "कालच्या तुलनेत",
      profitEst: "अंदाजे नफा",
      margin: "ग्रॉस मार्जिन",
      sevenDayTrend: "मागील ७ दिवसांची विक्री",
      topProducts: "सर्वाधिक विकल्या जाणाऱ्या वस्तू (३० दिवस)",
      recommendationsHero: "AI बिझनेस पार्टनरचे महत्त्वाचे सल्ले",
      quickActions: "त्वरित कृती",
      restockAction: "कमी साठा मागवा",
      sendOfferAction: "ग्राहक ऑफर पाठवा",
      viewReportAction: "बिझनेस अहवाल",
      askCopilotAction: "AI कोपायलटला विचारा",
      upiShare: "पेटीएम साउंडबॉक्स व डिजिटल वाटा",
      itemsLowStock: "वस्तूंचा साठा कमी",
    },
    sales: {
      title: "विक्री व व्यवहार तपशील",
      week: "मागील ७ दिवस",
      month: "मागील ३० दिवस",
      totalRevenue: "एकूण महसूल",
      transactions: "एकूण व्यवहार",
      avgOrder: "सरासरी बिल (ATV)",
      salesTrend: "दैनंदिन विक्री आलेख",
      categories: "कॅटेगरीनुसार विक्री",
      peakHours: "दुकानातील गर्दीची वेळ",
      bestDay: "सर्वाधिक विक्रीचा दिवस",
      worstDay: "सर्वात कमी विक्रीचा दिवस",
    },
    stock: {
      title: "AI इन्व्हेंटरी व्यवस्थापन",
      searchPlaceholder: "मालाचे नाव किंवा कॅटेगरी शोधा...",
      all: "सर्व वस्तू",
      lowStock: "कमी साठा इशारा",
      okStock: "पुरेसा साठा",
      reorderLevel: "किमान मर्यादा",
      currentStock: "सध्याचा साठा",
      forecast7d: "७ दिवसांची अपेक्षित मागणी",
      suggestedReorder: "AI ने सुचवलेली ऑर्डर",
      urgentBanner: "वस्तूंचा साठा वीकेंडपूर्वी संपू शकतो",
    },
    customers: {
      title: "ग्राहक विश्लेषण व निष्ठा",
      regular: "नियमित ग्राहक",
      occasional: "कधीकधी येणारे",
      atRisk: "धोक्यात असलेले (At-Risk)",
      totalSpend: "एकूण खरेदी",
      visits: "दुकानात आलेल्या फेऱ्या",
      lastSeen: "शेवटची भेट",
      sendOffer: "व्हॉट्सॲप ऑफर पाठवा",
      churnRiskTag: "पुन्हा आकर्षित करण्याची गरज",
    },
    marketing: {
      title: "AI मार्केटिंग सहाय्यक",
      selectSegment: "लक्षित ग्राहक वर्ग",
      selectGoal: "मोहिमेचा उद्देश",
      selectLanguage: "संदेशाची भाषा",
      generateBtn: "प्रमोशनल मेसेज तयार करा",
      copyBtn: "कॉपी करा",
      copied: "कॉपी झाले!",
      sendWhatsapp: "व्हॉट्सॲपवर पाठवा",
    },
    finance: {
      title: "आर्थिक विश्लेषण व कॅश फ्लो",
      revenue: "एकूण विक्री",
      cogs: "खरेदी किंमत (COGS)",
      grossProfit: "ग्रॉस नफा",
      expenses: "दुकानाचे खर्च",
      netProfit: "अंदाजे निव्वळ नफा",
      explainBtn: "AI कडून आर्थिक विश्लेषण समजून घ्या",
      readAloud: "आवाजात ऐका",
    },
    copilot: {
      title: "AI बिझनेस कोपायलट",
      placeholder: "विक्री, साठा किंवा नफ्याबद्दल मराठी/इंग्रजीत विचारा...",
      listening: "ऐकत आहे... माईकमध्ये बोला",
      speakPrompt: "माईक दाबून बोला",
      toolsBadge: "पडताळलेला पेटीएम स्टोअर डेटा",
    },
    settings: {
      title: "मर्चंट सेटिंग्ज व जोडण्या",
      plan: "योजना",
      dataSource: "जोडलेली पेटीएम उपकरणे",
      privacy: "डेटा सुरक्षा व गोपनीयता",
    },
  },
};
