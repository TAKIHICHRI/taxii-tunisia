import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface RatingModalProps {
  rideId: string;
  driverName?: string;
  onSubmit: (stars: number, comment?: string) => void;
  onSkip?: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({ driverName, onSubmit, onSkip }) => {
  const { t } = useTranslation();
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const options = ['النظافة', 'الوقت', 'السياقة', 'التواصل', 'المسار'];
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (stars < 1) return;
    setSubmitted(true);
    const tagText = tags.length ? ` [${tags.join('، ')}]` : '';
    onSubmit(stars, (comment.trim() + tagText).trim() || undefined);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-dark-800 rounded-3xl p-8 text-center"
      >
        <div className="text-5xl mb-3">🙏</div>
        <h3 className="font-bold text-dark-900 dark:text-white text-lg">{t('thankYou')}</h3>
        <p className="text-dark-500 dark:text-dark-400 text-sm mt-1">{t('thankYouSub')}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-dark-800 rounded-3xl p-6"
    >
      <h3 className="font-bold text-dark-900 dark:text-white text-lg mb-1">{t('rateDriver')}</h3>
      {driverName && <p className="text-dark-500 dark:text-dark-400 text-sm mb-4">{driverName}</p>}
      <p className="text-dark-600 dark:text-dark-300 text-sm mb-4">{t('rateExperience')}</p>

      <div className="flex justify-center gap-2 mb-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setStars(i)}
            className="p-1 transition-transform active:scale-90"
          >
            <Star
              size={36}
              className={(hover || stars) >= i ? 'text-primary-500 fill-primary-500' : 'text-dark-200 dark:text-dark-500'}
            />
          </button>
        ))}
      </div>

      <textarea
        placeholder={t('addComment')}
        className="input-field text-sm min-h-[80px] resize-none mb-4"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={200}
      />
      <div className="flex flex-wrap gap-2 mb-4">
        {options.map((opt) => {
          const active = tags.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() =>
                setTags((prev) => (prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]))
              }
              className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                active ? 'bg-primary-100 text-primary-700' : 'bg-dark-100 text-dark-600'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        {onSkip && (
          <button type="button" onClick={onSkip} className="btn-outline flex-1 py-3">
            {t('skip')}
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={stars < 1}
          className="btn-primary flex-1 py-3 disabled:opacity-50"
        >
          {t('submit')}
        </button>
      </div>
    </motion.div>
  );
};

export default RatingModal;
