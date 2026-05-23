import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { messService } from '../../services/api';
import { ArrowLeft, Filter, Search } from 'lucide-react';
import { MessCard } from '../../components/shared/MessCard';

const Browse = () => {
  const navigate = useNavigate();
  const [messes, setMesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    messService.getAllMess().then(data => {
      setMesses(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-background">
      <header className="px-6 pt-12 pb-4 bg-surface rounded-b-3xl shadow-sm z-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-surface-container">
              <ArrowLeft className="w-6 h-6 text-on-surface" />
            </button>
            <h1 className="text-headline-lg font-extrabold text-on-surface">Explore Mess</h1>
          </div>
          <button className="p-2 rounded-full hover:bg-surface-container bg-surface-container text-primary-dark">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-outline" />
          <input 
            type="text" 
            placeholder="Search by name or food type..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-surface-container text-on-surface outline-none transition-colors"
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar flex flex-col gap-4 pb-24">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-56 bg-surface-container animate-pulse rounded-xl"></div>
          ))
        ) : (
          <div className="flex flex-col gap-4 md:grid md:grid-cols-3 md:gap-6">
            {messes.map(mess => (
              <MessCard key={mess.id} mess={mess} onClick={() => navigate(`/student/mess/${mess.id}`)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Browse;
