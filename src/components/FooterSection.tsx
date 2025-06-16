
import React from "react";
import { BookOpen } from "lucide-react";

export const FooterSection = () => (
  <footer className="mt-10 pt-6 border-t text-xs text-muted-foreground flex items-center justify-center text-center">
    <div className="flex flex-col items-center">
      <div className="flex items-center">
        <BookOpen className="mr-2 text-primary" size={16} />
        <span>
          Feito com <span className="text-red-600">♥</span> para modders brasileiros. | <a href="https://github.com/shirakumo/snbt-i18npy" className="underline" target="_blank" rel="noopener noreferrer">Python original</a>
        </span>
      </div>
    </div>
  </footer>
);
