import { useState } from "react";
import { toast } from "react-hot-toast";
import { Mail } from "lucide-react";
import { useAppContext } from "../context/AppContext";

const NewLetter = () => {
  const [email, setEmail] = useState("");
  const { language = 'en' } = useAppContext();

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error(language === 'hi' ? "कृपया अपना ईमेल पता दर्ज करें।" : "Please enter your email address.");
      return;
    }

    setEmail("");
    toast.success(language === 'hi' ? "धन्यवाद! मौसमी कृषि छूट और अलर्ट आपको भेजे जाएंगे।" : "Subscribed! Seasonal harvest rental alerts will be sent to your inbox.");
  };

  return (
    <section className="max-w-4xl mx-auto px-4 my-14 antialiased">
      <div className="bg-slate-100/70 rounded-xl p-6 sm:p-8 border border-slate-200 text-center space-y-3">
        
        <div className="w-10 h-10 rounded-lg bg-blue-700 text-white flex items-center justify-center mx-auto">
          <Mail className="w-5 h-5" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {language === 'hi' ? 'मौसमी जुताई व कटाई अलर्ट प्राप्त करें' : 'Seasonal Harvest & Equipment Availability Alerts'}
        </h2>

        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          {language === 'hi'
            ? 'अपने जिले में उच्च-अश्वशक्ति (HP) ट्रैक्टर और रोटावेटर उपलब्ध होने पर तुरंत सूचना पाएं।'
            : 'Get notified when high-horsepower tractors and implements become available in your district at early-bird rates.'}
        </p>

        <form 
          onSubmit={handleSubmit} 
          className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={language === 'hi' ? "अपना ईमेल पता दर्ज करें" : "Enter your email address"}
            className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-blue-700 font-medium"
            required
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            {language === 'hi' ? 'सब्सक्राइब करें' : 'Subscribe'}
          </button>
        </form>

      </div>
    </section>
  );
};

export default NewLetter;
