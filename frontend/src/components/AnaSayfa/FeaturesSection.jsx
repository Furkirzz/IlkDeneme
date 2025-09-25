import React from "react";
import { FiUsers, FiStar, FiTarget } from "react-icons/fi";
import { BsCalendar as BsLightbulb, BsGraphUp } from "react-icons/bs";

const FeaturesSection = () => {
  const features = [
    {
      icon: FiTarget,
      title: "Hedef Odaklı Eğitim",
      description:
        "Her öğrencinin hedeflerine uygun kişiselleştirilmiş eğitim programları",
      color: "from-red-500 to-red-600",
    },
    {
      icon: FiUsers,
      title: "Uzman Kadrosu",
      description: "Alanında uzman, deneyimli öğretmenlerle kaliteli eğitim",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: BsGraphUp,
      title: "Sürekli Gelişim",
      description:
        "Düzenli değerlendirme ve takip sistemiyle sürekli gelişim",
      color: "from-green-500 to-green-600",
    },
    {
      icon: BsLightbulb,
      title: "Yenilikçi Yöntemler",
      description:
        "Modern eğitim teknolojileri ve yenilikçi öğretim yöntemleri",
      color: "from-purple-500 to-purple-600",
    },
  ];

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ef4444' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800 mb-4">
            <FiStar className="w-4 h-4 mr-2" />
            Neden Biz?
          </span>

          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Eğitimde Fark Yaratan
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">
              Özelliklerimiz
            </span>
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Modern eğitim anlayışımız ve öğrenci odaklı yaklaşımımızla fark
            yaratıyoruz
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="group">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 group-hover:text-red-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
