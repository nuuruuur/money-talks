import React, {
  useState,
  createContext,
  useContext,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  Home,
  History,
  Settings,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  Plus,
  Trash2,
  X,
  Calendar as CalendarIcon,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  MoreHorizontal,
  Calculator as CalculatorIcon,
  Loader2,
} from "lucide-react";

// ==========================================
// KONFIGURASI DATABASE API
// Masukkan URL Web App dari Google Apps Script Anda di sini
const API_URL =
  "https://script.google.com/macros/s/AKfycbyGfd8GhA-oy0mVf_0fV_cVP-tWcKD9SE39CCehN2XkVKwvhzaFcSFoYgO9YNsoN0kSsQ/exec";
// ==========================================

// --- CONTEXT (GLOBAL STATE) ---
const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Ambil data dari Spreadsheet saat aplikasi pertama kali dimuat
  useEffect(() => {
    const fetchData = async () => {
      if (API_URL === "URL_APPSCRIPT_ANDA_DI_SINI") {
        console.warn(
          "API URL belum diisi. Aplikasi akan menggunakan array kosong."
        );
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data.status === "success") {
          setWallets(data.data.wallets || []);
          setCategories(data.data.categories || []);
          setTransactions(data.data.transactions || []);
        }
      } catch (error) {
        console.error("Gagal mengambil data dari server:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fungsi helper untuk mengirim data ke server
  const syncWithServer = async (action, data) => {
    if (API_URL === "URL_APPSCRIPT_ANDA_DI_SINI") return;
    try {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action, data }),
      });
    } catch (error) {
      console.error(`Gagal sinkronisasi aksi ${action}:`, error);
    }
  };

  const addWallet = (wallet) => {
    const newWallet = { ...wallet, id: `w${Date.now()}` };
    setWallets([...wallets, newWallet]);
    syncWithServer("addWallet", newWallet);
  };

  const updateWallet = (id, updated) => {
    setWallets(wallets.map((w) => (w.id === id ? { ...w, ...updated } : w)));
    syncWithServer("updateWallet", { id, ...updated });
  };

  const deleteWallet = (id) => {
    setWallets(wallets.filter((w) => w.id !== id));
    syncWithServer("deleteWallet", { id });
  };

  const addCategory = (category) => {
    const newCategory = { ...category, id: `c${Date.now()}` };
    setCategories([...categories, newCategory]);
    syncWithServer("addCategory", newCategory);
  };

  const deleteCategory = (id) => {
    setCategories(categories.filter((c) => c.id !== id));
    syncWithServer("deleteCategory", { id });
  };

  const addTransaction = (trx) => {
    const newTrx = { ...trx, id: `t${Date.now()}` };
    setTransactions([newTrx, ...transactions]);
    syncWithServer("addTransaction", newTrx);

    // Update Saldo Dompet secara lokal dan sinkronisasi
    if (trx.type === "Income") {
      const wallet = wallets.find((w) => w.id === trx.wallet_id);
      if (wallet)
        updateWallet(trx.wallet_id, { balance: wallet.balance + trx.amount });
    } else if (trx.type === "Expense") {
      const wallet = wallets.find((w) => w.id === trx.wallet_id);
      if (wallet)
        updateWallet(trx.wallet_id, { balance: wallet.balance - trx.amount });
    } else if (trx.type === "Transfer") {
      const wFrom = wallets.find((w) => w.id === trx.from_wallet_id);
      const wTo = wallets.find((w) => w.id === trx.to_wallet_id);
      if (wFrom)
        updateWallet(trx.from_wallet_id, {
          balance: wFrom.balance - trx.amount,
        });
      if (wTo)
        updateWallet(trx.to_wallet_id, { balance: wTo.balance + trx.amount });
    }
  };

  return (
    <AppContext.Provider
      value={{
        wallets,
        addWallet,
        updateWallet,
        deleteWallet,
        categories,
        addCategory,
        deleteCategory,
        transactions,
        addTransaction,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// --- SHADCN UI: COMPONENTS ---
const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}
  >
    {children}
  </div>
);

const Button = React.forwardRef(
  ({ children, variant = "primary", className = "", ...props }, ref) => {
    const baseStyle =
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C5D81] disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full md:w-auto";
    const variants = {
      primary: "bg-[#33406C] text-white hover:bg-[#4C5D81]",
      secondary: "bg-slate-100 text-[#33406C] hover:bg-slate-200",
      outline:
        "border border-slate-200 bg-white hover:bg-slate-100 text-[#33406C]",
      ghost: "hover:bg-slate-100 hover:text-[#33406C] text-[#4C5D81]",
      danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
    };
    return (
      <button
        ref={ref}
        className={`${baseStyle} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

const Input = React.forwardRef(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    className={`flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C5D81] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
));

const Label = ({ children, className = "", htmlFor }) => (
  <label
    htmlFor={htmlFor}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
  >
    {children}
  </label>
);

// --- SHADCN UI: PAGINATION ---
const Pagination = ({ className, ...props }) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={`mx-auto flex w-full justify-center ${className}`}
    {...props}
  />
);

const PaginationContent = React.forwardRef(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={`flex flex-row items-center gap-1 ${className}`}
    {...props}
  />
));

const PaginationItem = React.forwardRef(({ className, ...props }, ref) => (
  <li ref={ref} className={className} {...props} />
));

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  children,
  ...props
}) => (
  <button
    aria-current={isActive ? "page" : undefined}
    className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C5D81] disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 hover:text-[#33406C] ${
      isActive
        ? "border border-slate-200 bg-white shadow-sm font-bold text-[#33406C]"
        : "text-[#4C5D81]"
    } ${size === "default" ? "h-9 px-4 py-2" : "h-9 w-9"} ${className}`}
    {...props}
  >
    {children}
  </button>
);

const PaginationPrevious = ({ className, ...props }) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={`gap-1 pl-2.5 ${className}`}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span className="hidden sm:block">Prev</span>
  </PaginationLink>
);

const PaginationNext = ({ className, ...props }) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={`gap-1 pr-2.5 ${className}`}
    {...props}
  >
    <span className="hidden sm:block">Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
);

const PaginationEllipsis = ({ className, ...props }) => (
  <span
    aria-hidden
    className={`flex h-9 w-9 items-center justify-center text-[#4C5D81] ${className}`}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">Lebih banyak halaman</span>
  </span>
);

// --- SHADCN UI: DIALOG ---
const DialogContext = createContext();

const Dialog = ({ children, open: controlledOpen, onOpenChange }) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = onOpenChange || setUncontrolledOpen;

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
};

const DialogTrigger = ({ asChild, children }) => {
  const { setOpen } = useContext(DialogContext);
  if (asChild)
    return React.cloneElement(children, { onClick: () => setOpen(true) });
  return <button onClick={() => setOpen(true)}>{children}</button>;
};

const DialogContent = ({ children, className = "" }) => {
  const { open, setOpen } = useContext(DialogContext);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-[#33406C]/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 flex justify-center items-center p-4">
      <div
        className={`relative bg-white rounded-lg shadow-lg w-full p-6 animate-in fade-in zoom-in-95 sm:max-w-lg ${className}`}
      >
        {children}
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#4C5D81] focus:ring-offset-2"
        >
          <X className="h-4 w-4 text-[#33406C]" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
};

const DialogHeader = ({ children }) => (
  <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
    {children}
  </div>
);
const DialogTitle = ({ children }) => (
  <h2 className="text-lg font-semibold leading-none tracking-tight text-[#33406C]">
    {children}
  </h2>
);
const DialogDescription = ({ children }) => (
  <p className="text-sm text-[#4C5D81]">{children}</p>
);
const DialogFooter = ({ children }) => (
  <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4">
    {children}
  </div>
);
const DialogClose = ({ asChild, children }) => {
  const { setOpen } = useContext(DialogContext);
  if (asChild)
    return React.cloneElement(children, { onClick: () => setOpen(false) });
  return <button onClick={() => setOpen(false)}>{children}</button>;
};

const FieldGroup = ({ children }) => (
  <div className="space-y-4 py-2">{children}</div>
);
const Field = ({ children }) => (
  <div className="flex flex-col space-y-1.5">{children}</div>
);

// --- SHADCN UI: POPOVER ---
const PopoverContext = createContext();

const Popover = ({ children }) => {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <PopoverContext.Provider value={{ open, setOpen, popoverRef }}>
      <div ref={popoverRef} className="relative w-full md:w-auto">
        {children}
      </div>
    </PopoverContext.Provider>
  );
};

const PopoverTrigger = ({ asChild, children }) => {
  const { open, setOpen } = useContext(PopoverContext);
  if (asChild)
    return React.cloneElement(children, { onClick: () => setOpen(!open) });
  return <button onClick={() => setOpen(!open)}>{children}</button>;
};

const PopoverContent = ({ children, className = "", align = "center" }) => {
  const { open } = useContext(PopoverContext);
  if (!open) return null;
  const alignClass =
    align === "start"
      ? "left-0"
      : align === "end"
      ? "right-0"
      : "left-1/2 -translate-x-1/2";

  return (
    <div
      className={`absolute top-full z-[80] mt-2 w-72 rounded-md border border-slate-200 bg-white p-4 text-[#33406C] shadow-md outline-none animate-in fade-in-80 zoom-in-95 ${alignClass} ${className}`}
    >
      {children}
    </div>
  );
};

// --- SHADCN UI: CALENDAR (DATE PICKER COMPONENT) ---
const Calendar = ({ selected, onSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(selected || new Date());

  const handlePrevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  const handleNextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const handleSelect = (day) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    onSelect(newDate);
  };

  const isSelected = (day) => {
    if (!selected) return false;
    return (
      selected.getDate() === day &&
      selected.getMonth() === currentMonth.getMonth() &&
      selected.getFullYear() === currentMonth.getFullYear()
    );
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    );
  };

  const monthName = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(currentMonth);

  return (
    <div className="p-3 text-[#33406C]">
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 hover:bg-slate-100 rounded-md"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold">{monthName}</span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 hover:bg-slate-100 rounded-md"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[0.8rem] text-[#4C5D81] mb-2">
        {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d) => (
          <div key={d} className="font-medium">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          return (
            <button
              key={day}
              type="button"
              onClick={() => handleSelect(day)}
              className={`h-8 w-8 rounded-md text-sm transition-colors hover:bg-slate-100 focus:outline-none flex items-center justify-center
                ${
                  isSelected(day)
                    ? "bg-[#33406C] text-[#F9C51C] hover:bg-[#33406C] font-semibold"
                    : ""
                } 
                ${
                  !isSelected(day) && isToday(day)
                    ? "bg-slate-100 text-[#33406C] font-bold"
                    : ""
                }
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- SHADCN UI: SELECT -
const SelectContext = createContext();

const Select = ({ value, onValueChange, disabled, children }) => {
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState({});
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange,
        open,
        setOpen,
        labels,
        setLabels,
        disabled,
      }}
    >
      <div ref={wrapperRef} className="relative w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = ({ children, className = "" }) => {
  const { open, setOpen, disabled } = useContext(SelectContext);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setOpen(!open)}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4C5D81] disabled:cursor-not-allowed disabled:opacity-50 text-[#33406C] ${className}`}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50 text-[#4C5D81]" />
    </button>
  );
};

const SelectValue = ({ placeholder }) => {
  const { value, labels } = useContext(SelectContext);
  return (
    <span className="truncate">
      {value && labels[value] ? (
        labels[value]
      ) : (
        <span className="text-slate-400">{placeholder}</span>
      )}
    </span>
  );
};

const SelectContent = ({ children, className = "" }) => {
  const { open } = useContext(SelectContext);
  if (!open) return null;
  return (
    <div
      className={`absolute top-full left-0 z-[120] mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-slate-200 bg-white text-[#33406C] shadow-md animate-in fade-in-80 zoom-in-95 ${className}`}
    >
      <div className="p-1">{children}</div>
    </div>
  );
};

const SelectGroup = ({ children }) => <div>{children}</div>;

const SelectLabel = ({ children }) => (
  <div className="py-1.5 pl-8 pr-2 text-sm font-semibold text-[#4C5D81]">
    {children}
  </div>
);

const SelectItem = ({ value, children, className = "" }) => {
  const {
    value: selectedValue,
    onValueChange,
    setOpen,
    setLabels,
  } = useContext(SelectContext);
  const isSelected = selectedValue === value;

  useEffect(() => {
    setLabels((prev) => {
      if (prev[value] !== children) return { ...prev, [value]: children };
      return prev;
    });
  }, [value, children, setLabels]);

  return (
    <div
      onClick={() => {
        onValueChange(value);
        setOpen(false);
      }}
      className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100 ${
        isSelected ? "font-semibold text-[#33406C]" : "text-[#4C5D81]"
      } ${className}`}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4 text-[#33406C]" />}
      </span>
      <span className="truncate">{children}</span>
    </div>
  );
};

// --- HELPER FUNCTIONS ---

// Mengekstrak root domain (misal: https://www.bca.co.id -> bca.co.id)
const extractDomain = (url) => {
  if (!url) return "";
  let domain = url.trim();
  // Hilangkan protokol http/https
  if (domain.indexOf("://") > -1) {
    domain = domain.split('/')[2];
  } else {
    domain = domain.split('/')[0];
  }
  // Hilangkan port jika ada
  domain = domain.split(':')[0];
  // Hilangkan www.
  domain = domain.replace(/^www\./, '');
  return domain;
};

// Fungsi memberi format titik saat mengetik angka (HANYA VISUAL)
const formatNumberInput = (val) => {
  if (!val && val !== 0) return "";
  let stringVal = val.toString().replace(/\D/g, "");
  if (!stringVal) return "";
  stringVal = stringVal.replace(/^0+(?=\d)/, "");
  return stringVal.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Fungsi menghapus titik saat akan disimpan (ANGKA MURNI)
const parseNumberInput = (val) => {
  return val.toString().replace(/\./g, "").replace(/\D/g, "");
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
const formatShortCurrency = (amount) =>
  amount >= 1000000
    ? `Rp${(amount / 1000000).toFixed(1)}Jt`
    : amount >= 1000
    ? `Rp${(amount / 1000).toFixed(0)}rb`
    : `Rp${amount}`;
const formatDateStr = (dateObj) => {
  const d = new Date(dateObj);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};
const formatDatePPP = (date) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

// --- COMPONENT: BRAND ICON FALLBACK ---
const BrandIcon = ({ domain, size = 16, className = "" }) => {
  const [error, setError] = useState(false);

  // Jika domain kosong ATAU gambar gagal dimuat (error), tampilkan icon Wallet biasa
  if (!domain || error) {
    return <Wallet size={size} className={className} />;
  }

  return (
    <img
      src={`https://cdn.brandfetch.io/${domain}/icon.png?c=1idpg7kO2mvAgJplzZR`}
      alt="Brand Logo"
      style={{ width: size, height: size }}
      className={`object-contain ${className}`}
      onError={() => setError(true)} // Akan terpicu jika API gagal mengembalikan logo
    />
  );
};

// --- FLOATING DESMOS CALCULATOR WIDGET ---
const FloatingCalculator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const calcRef = useRef(null);
  const calcInstance = useRef(null);

  useEffect(() => {
    const scriptId = "desmos-api-script";

    const initDesmos = () => {
      if (calcRef.current && !calcInstance.current && window.Desmos) {
        calcInstance.current = window.Desmos.ScientificCalculator(
          calcRef.current
        );
      }
    };

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://www.desmos.com/api/v1.11/calculator.js?apiKey=aea0164e7c4348649ba21c93c4a4a54c";
      script.async = true;
      script.onload = initDesmos;
      document.body.appendChild(script);
    } else {
      if (window.Desmos) {
        initDesmos();
      } else {
        document.getElementById(scriptId).addEventListener("load", initDesmos);
      }
    }
  }, []);

  return (
    <div className="relative z-[100]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full transition-all duration-300 shadow-sm border border-transparent ${
          isOpen
            ? "bg-[#33406C] text-[#F9C51C]"
            : "bg-white text-[#33406C] border-slate-200 hover:bg-slate-50 hover:text-[#4C5D81]"
        }`}
      >
        <CalculatorIcon size={20} />
      </button>

      <div
        className={`absolute top-full right-0 mt-3 w-[calc(100vw-3rem)] sm:w-[350px] md:w-[400px] h-[400px] bg-white shadow-[0_12px_40px_rgba(51,64,108,0.2)] rounded-2xl border border-slate-200 overflow-hidden transition-all duration-300 origin-top-right flex flex-col z-[100]
          ${
            isOpen
              ? "scale-100 opacity-100 visible"
              : "scale-95 opacity-0 invisible pointer-events-none"
          }`}
      >
        <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-[#33406C] shrink-0">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <CalculatorIcon size={16} className="text-[#F9C51C]" /> Kalkulator
            Cepat
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-md hover:bg-[#4C5D81] text-[#F9C51C] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 w-full bg-white relative">
          <div ref={calcRef} className="absolute inset-0 w-full h-full"></div>
        </div>
      </div>
    </div>
  );
};

// --- VIEWS ---
const DashboardView = () => {
  const { wallets } = useContext(AppContext);
  const totalBalance = useMemo(
    () => wallets.reduce((acc, curr) => acc + curr.balance, 0),
    [wallets]
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-2">
      <div className="bg-[#33406C] rounded-2xl md:rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#F9C51C]/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
        <p className="text-[#F9C51C] text-sm md:text-base font-semibold mb-1 relative z-10 tracking-wide uppercase">
          Total Saldo Gabungan
        </p>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight relative z-10 text-white">
          {formatCurrency(totalBalance)}
        </h1>
      </div>

      <div>
        <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2 text-[#33406C]">
          <Wallet size={20} className="text-[#4C5D81]" /> Daftar Dompet
        </h2>
        {wallets.length === 0 ? (
          <div className="text-center py-8 text-[#4C5D81] bg-white rounded-xl border border-dashed border-slate-300">
            Belum ada dompet. Tambahkan di menu Settings.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {wallets.map((wallet) => (
              <Card
                key={wallet.id}
                className="p-4 md:p-5 hover:border-[#4C5D81] hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 md:p-2.5 bg-slate-50 group-hover:bg-[#33406C]/5 rounded-lg transition-colors flex items-center justify-center min-w-[32px] min-h-[32px]">
                    <BrandIcon domain={wallet.domain} size={16} className="text-[#4C5D81]" />
                  </div>
                  <span className="text-[10px] md:text-xs font-semibold text-[#4C5D81] bg-slate-100 px-2 py-1 rounded-full">
                    {wallet.type}
                  </span>
                </div>
                <p className="text-sm md:text-base font-medium text-[#4C5D81] truncate">
                  {wallet.name}
                </p>
                <p className="text-lg md:text-xl font-bold text-[#33406C] mt-1">
                  {formatCurrency(wallet.balance)}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TransactionFormView = () => {
  const { wallets, categories, addTransaction } = useContext(AppContext);
  const [type, setType] = useState("Expense");

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const [dateSelection, setDateSelection] = useState("Hari Ini");
  const [customDateObj, setCustomDateObj] = useState(today);

  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState("");
  const [fromWalletId, setFromWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");

  React.useEffect(() => {
    if (wallets.length > 0) {
      if (!walletId) setWalletId(wallets[0].id);
      if (!fromWalletId) setFromWalletId(wallets[0].id);
      if (wallets.length > 1 && !toWalletId) setToWalletId(wallets[1].id);
    }
  }, [wallets]);

  React.useEffect(() => {
    const filteredCats = categories.filter((c) => c.type === type);
    if (filteredCats.length > 0) setCategoryId(filteredCats[0].id);
    else setCategoryId("");
  }, [type, categories]);

  const handleAddZeros = (zeros) => {
    if (!amount || amount === "0") return;
    setAmount((prev) => prev + zeros);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount)))
      return alert("Masukkan jumlah yang valid");
    if (type !== "Transfer" && !walletId)
      return alert("Pilih Dompet terlebih dahulu");
    if (type !== "Transfer" && !categoryId)
      return alert("Pilih Kategori terlebih dahulu");
    if (type === "Transfer" && (!fromWalletId || !toWalletId))
      return alert("Pilih Dompet Asal dan Tujuan");

    let finalDate;
    if (dateSelection === "Hari Ini") finalDate = formatDateStr(today);
    else if (dateSelection === "Kemarin") finalDate = formatDateStr(yesterday);
    else if (dateSelection === "Kemarin Lusa")
      finalDate = formatDateStr(twoDaysAgo);
    else finalDate = formatDateStr(customDateObj);

    const trxData = {
      date: finalDate,
      type,
      amount: parseFloat(amount),
      notes,
    };

    if (type === "Transfer") {
      if (fromWalletId === toWalletId)
        return alert("Dompet asal dan tujuan tidak boleh sama");
      trxData.from_wallet_id = fromWalletId;
      trxData.to_wallet_id = toWalletId;
      trxData.category_id = null;
    } else {
      trxData.wallet_id = walletId;
      trxData.category_id = categoryId;
    }

    addTransaction(trxData);
    alert("Transaksi berhasil disimpan!");
    setAmount("");
    setNotes("");
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <div className="w-full max-w-xl mx-auto animate-in slide-in-from-bottom-2 space-y-4 md:space-y-6">
      <h2 className="text-xl md:text-2xl font-bold text-[#33406C]">
        Catat Transaksi
      </h2>

      <div className="flex p-1.5 bg-slate-100 rounded-lg">
        {["Income", "Expense", "Transfer"].map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`flex-1 py-2.5 text-sm md:text-base font-medium rounded-md transition-all duration-300 ${
              type === t
                ? "bg-[#33406C] text-[#F9C51C] shadow-md transform scale-100"
                : "text-[#4C5D81] hover:text-[#33406C] hover:bg-white/50 scale-95"
            }`}
          >
            {t === "Income" && (
              <ArrowDownRight
                size={18}
                className={`inline mr-1 ${
                  type === t ? "text-green-400" : "text-green-500"
                }`}
              />
            )}
            {t === "Expense" && (
              <ArrowUpRight
                size={18}
                className={`inline mr-1 ${
                  type === t ? "text-red-400" : "text-red-500"
                }`}
              />
            )}
            {t === "Transfer" && (
              <ArrowRightLeft
                size={18}
                className={`inline mr-1 ${
                  type === t ? "text-[#F9C51C]" : "text-[#4C5D81]"
                }`}
              />
            )}
            <span className="hidden sm:inline">
              {t === "Income"
                ? "Pemasukan"
                : t === "Expense"
                ? "Pengeluaran"
                : "Transfer"}
            </span>
            <span className="sm:hidden">
              {t === "Income" ? "Masuk" : t === "Expense" ? "Keluar" : "Trf"}
            </span>
          </button>
        ))}
      </div>

      <Card className="p-5 md:p-6 shadow-sm border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <div className="flex justify-between items-end">
              <Label className="text-[#4C5D81]">Jumlah (Rp)</Label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddZeros("00")}
                  className="px-2.5 py-1.5 text-[11px] font-bold bg-slate-100 text-[#4C5D81] rounded-md hover:bg-slate-200 hover:text-[#33406C] transition-colors shadow-sm"
                >
                  00
                </button>
                <button
                  type="button"
                  onClick={() => handleAddZeros("000")}
                  className="px-2.5 py-1.5 text-[11px] font-bold bg-slate-100 text-[#4C5D81] rounded-md hover:bg-slate-200 hover:text-[#33406C] transition-colors shadow-sm"
                >
                  000
                </button>
              </div>
            </div>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={formatNumberInput(amount)}
              onChange={(e) => setAmount(parseNumberInput(e.target.value))}
              className="text-2xl md:text-3xl font-bold h-14 md:h-16 text-[#33406C]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#4C5D81]">Tanggal</Label>
            <div className="flex flex-wrap gap-2">
              {["Hari Ini", "Kemarin", "Kemarin Lusa", "Kustom"].map((ds) => (
                <button
                  type="button"
                  key={ds}
                  onClick={() => setDateSelection(ds)}
                  className={`px-3.5 py-2 text-xs md:text-sm font-semibold rounded-full border transition-all duration-300 ${
                    dateSelection === ds
                      ? "bg-[#33406C] text-white border-[#33406C] shadow-md"
                      : "bg-white text-[#4C5D81] border-slate-200 hover:bg-slate-50 hover:text-[#33406C]"
                  }`}
                >
                  {ds}
                </button>
              ))}
            </div>

            {dateSelection === "Kustom" && (
              <div className="mt-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full md:w-[240px] justify-between text-left font-normal border-slate-200 ${
                        !customDateObj
                          ? "text-slate-400"
                          : "text-[#33406C] font-medium"
                      }`}
                    >
                      {customDateObj ? (
                        formatDatePPP(customDateObj)
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                      <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      selected={customDateObj}
                      onSelect={(date) => {
                        setCustomDateObj(date);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {type !== "Transfer" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <div className="space-y-1.5">
                <Label className="text-[#4C5D81]">Dompet</Label>
                <Select value={walletId} onValueChange={setWalletId}>
                  <SelectTrigger className="md:h-11">
                    <SelectValue placeholder="Pilih Dompet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {wallets.length === 0 && (
                        <SelectLabel>Belum ada dompet</SelectLabel>
                      )}
                      {wallets.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          <div className="flex items-center gap-2">
                            <BrandIcon domain={w.domain} size={14} />
                            <span>{w.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#4C5D81]">Kategori</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="md:h-11">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {filteredCategories.length === 0 && (
                        <SelectLabel>Tidak ada kategori</SelectLabel>
                      )}
                      {filteredCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <div className="space-y-1.5">
                <Label className="text-[#4C5D81]">Dari Dompet</Label>
                <Select value={fromWalletId} onValueChange={setFromWalletId}>
                  <SelectTrigger className="md:h-11">
                    <SelectValue placeholder="Pilih Asal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {wallets.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          <div className="flex items-center gap-2">
                            <BrandIcon domain={w.domain} size={14} />
                            <span>{w.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#4C5D81]">Ke Dompet</Label>
                <Select value={toWalletId} onValueChange={setToWalletId}>
                  <SelectTrigger className="md:h-11">
                    <SelectValue placeholder="Pilih Tujuan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {wallets.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          <div className="flex items-center gap-2">
                            <BrandIcon domain={w.domain} size={14} />
                            <span>{w.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[#4C5D81]">Catatan (Opsional)</Label>
            <Input
              type="text"
              placeholder="Cth: Makan siang"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="md:h-11 text-[#33406C]"
            />
          </div>

          <Button
            type="submit"
            className="w-full mt-4 h-12 md:h-14 text-md md:text-lg bg-[#F9C51C] text-[#33406C] hover:bg-[#e0b018] font-bold shadow-md"
          >
            Simpan Transaksi
          </Button>
        </form>
      </Card>
    </div>
  );
};

const HistoryView = () => {
  const { transactions, categories, wallets } = useContext(AppContext);

  const [filter, setFilter] = useState("All");
  const [itemsPerPage, setItemsPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, itemsPerPage]);

  const filteredTrx = transactions.filter((t) =>
    filter === "All" ? true : t.type === filter
  );

  const limit =
    itemsPerPage === "All" ? filteredTrx.length : parseInt(itemsPerPage, 10);
  const totalPages = Math.max(1, Math.ceil(filteredTrx.length / limit));
  const startIndex = (currentPage - 1) * limit;
  const currentItems = filteredTrx.slice(startIndex, startIndex + limit);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "ellipsis", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          "ellipsis",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(
          1,
          "ellipsis",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "ellipsis",
          totalPages
        );
      }
    }
    return pages;
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-in slide-in-from-bottom-2 space-y-4 md:space-y-6">
      <div className="flex justify-between items-center z-20 relative">
        <h2 className="text-xl md:text-2xl font-bold text-[#33406C]">
          Riwayat
        </h2>

        <div className="flex items-center gap-2">
          <div className="w-24 md:w-28">
            <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
              <SelectTrigger className="h-8 md:h-10 py-1 text-xs md:text-sm bg-white/80 backdrop-blur-sm border-slate-200">
                <SelectValue placeholder="Show..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="10">10 / Hlm</SelectItem>
                  <SelectItem value="20">20 / Hlm</SelectItem>
                  <SelectItem value="All">Semua</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="w-28 md:w-36">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="h-8 md:h-10 py-1 text-xs md:text-sm bg-white/80 backdrop-blur-sm border-slate-200">
                <SelectValue placeholder="Filter..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="All">Semua Tipe</SelectItem>
                  <SelectItem value="Income">Pemasukan</SelectItem>
                  <SelectItem value="Expense">Pengeluaran</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-3 md:space-y-4 min-h-[400px]">
        {currentItems.length === 0 ? (
          <div className="text-center text-[#4C5D81] py-12 bg-slate-50 rounded-xl md:rounded-2xl border border-dashed border-slate-300">
            Belum ada transaksi.
          </div>
        ) : (
          currentItems.map((trx) => {
            const category = categories.find((c) => c.id === trx.category_id);
            const wallet = wallets.find((w) => w.id === trx.wallet_id);
            const fromWallet = wallets.find((w) => w.id === trx.from_wallet_id);
            const toWallet = wallets.find((w) => w.id === trx.to_wallet_id);

            return (
              <Card
                key={trx.id}
                className="p-4 md:p-5 flex items-center justify-between hover:bg-slate-50 hover:border-[#4C5D81] transition-all group"
              >
                <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                  <div
                    className={`shrink-0 p-2.5 md:p-3 rounded-full ${
                      trx.type === "Income"
                        ? "bg-green-100 text-green-600"
                        : trx.type === "Expense"
                        ? "bg-red-100 text-red-600"
                        : "bg-[#4C5D81]/10 text-[#4C5D81]"
                    }`}
                  >
                    {trx.type === "Income" && <ArrowDownRight size={20} />}
                    {trx.type === "Expense" && <ArrowUpRight size={20} />}
                    {trx.type === "Transfer" && <ArrowRightLeft size={20} />}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm md:text-base font-bold text-[#33406C] truncate">
                      {trx.type === "Transfer"
                        ? "Transfer Saldo"
                        : category?.name || "Uncategorized"}
                    </p>
                    <div className="flex items-center text-xs md:text-sm text-[#4C5D81] gap-2 mt-0.5">
                      <span className="flex items-center gap-1 shrink-0">
                        <CalendarIcon size={12} /> {trx.date}
                      </span>
                      <span className="shrink-0">•</span>
                      <span className="truncate flex items-center gap-1.5">
                        {trx.type === "Transfer" ? (
                          <>
                            <BrandIcon domain={fromWallet?.domain} size={12} />
                            {fromWallet?.name} → <BrandIcon domain={toWallet?.domain} size={12} /> {toWallet?.name}
                          </>
                        ) : (
                          <>
                            <BrandIcon domain={wallet?.domain} size={12} />
                            {wallet?.name}
                          </>
                        )}
                      </span>
                    </div>
                    {trx.notes && (
                      <p className="text-xs md:text-sm text-slate-400 mt-1 italic truncate">
                        "{trx.notes}"
                      </p>
                    )}
                  </div>
                </div>
                <div
                  className={`shrink-0 font-bold text-sm md:text-base ml-2 ${
                    trx.type === "Income"
                      ? "text-green-600"
                      : trx.type === "Expense"
                      ? "text-[#33406C]"
                      : "text-[#4C5D81]"
                  }`}
                >
                  {trx.type === "Expense" ? "-" : "+"}
                  {formatCurrency(trx.amount)}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="pt-4 pb-2">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {getPageNumbers().map((page, index) => (
                <PaginationItem key={index}>
                  {page === "ellipsis" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

const RecapView = () => {
  const { transactions } = useContext(AppContext);

  const availableYears = useMemo(() => {
    const years = new Set(
      transactions.map((t) => new Date(t.date).getFullYear())
    );
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const [selectedYear, setSelectedYear] = useState(
    availableYears.length > 0
      ? availableYears[0].toString()
      : new Date().getFullYear().toString()
  );

  React.useEffect(() => {
    if (
      availableYears.length > 0 &&
      !availableYears.includes(Number(selectedYear))
    ) {
      setSelectedYear(availableYears[0].toString());
    }
  }, [availableYears, selectedYear]);

  const monthlyFlow = useMemo(() => {
    const data = Array.from({ length: 12 }, () => ({ income: 0, expense: 0 }));
    transactions.forEach((t) => {
      const d = new Date(t.date);
      if (d.getFullYear() === Number(selectedYear)) {
        if (t.type === "Income") data[d.getMonth()].income += t.amount;
        if (t.type === "Expense") data[d.getMonth()].expense += t.amount;
      }
    });
    return data;
  }, [transactions, selectedYear]);

  const totalYearlyIncome = monthlyFlow.reduce(
    (acc, curr) => acc + curr.income,
    0
  );
  const totalYearlyExpense = monthlyFlow.reduce(
    (acc, curr) => acc + curr.expense,
    0
  );
  const maxFlowAmount = Math.max(
    ...monthlyFlow.map((d) => Math.max(d.income, d.expense)),
    1
  );

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Ags",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

  return (
    <div className="w-full max-w-3xl mx-auto animate-in slide-in-from-bottom-2 space-y-5 md:space-y-6">
      <div className="flex justify-between items-center z-20 relative">
        <h2 className="text-xl md:text-2xl font-bold text-[#33406C]">
          Rekap Data
        </h2>

        {availableYears.length > 0 && (
          <div className="w-24 md:w-32">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-8 md:h-10 py-1 text-xs md:text-sm bg-white/80 backdrop-blur-sm shadow-sm font-semibold text-[#33406C]">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {availableYears.length === 0 ? (
        <div className="text-center text-[#4C5D81] py-12 bg-slate-50 rounded-xl md:rounded-2xl border border-dashed border-slate-300">
          Belum ada data transaksi.
        </div>
      ) : (
        <Card className="p-5 md:p-8 space-y-6 md:space-y-8 shadow-sm">
          <div className="grid grid-cols-2 gap-4 md:gap-8 border-b border-slate-100 pb-6">
            <div className="bg-[#33406C]/5 p-4 rounded-xl">
              <p className="text-xs md:text-sm font-bold text-[#4C5D81] uppercase flex items-center gap-1.5 mb-1">
                <TrendingUp size={16} className="text-green-500" /> Total Masuk
              </p>
              <h3 className="text-lg sm:text-xl md:text-3xl font-bold text-[#33406C] leading-tight truncate">
                {formatCurrency(totalYearlyIncome)}
              </h3>
            </div>
            <div className="bg-red-50 p-4 rounded-xl">
              <p className="text-xs md:text-sm font-bold text-[#4C5D81] uppercase flex items-center gap-1.5 mb-1">
                <TrendingDown size={16} className="text-red-500" /> Total Keluar
              </p>
              <h3 className="text-lg sm:text-xl md:text-3xl font-bold text-[#33406C] leading-tight truncate">
                {formatCurrency(totalYearlyExpense)}
              </h3>
            </div>
          </div>

          <div className="flex items-end h-48 md:h-64 gap-1.5 md:gap-3 pt-4 pb-1">
            {monthlyFlow.map((data, index) => {
              const incHeight = (data.income / maxFlowAmount) * 100;
              const expHeight = (data.expense / maxFlowAmount) * 100;
              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-default"
                >
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-14 bg-[#33406C] text-white text-[10px] md:text-xs py-1.5 px-3 rounded-md pointer-events-none whitespace-nowrap z-10 shadow-xl flex flex-col gap-0.5">
                    <span className="text-green-300 font-medium">
                      Masuk: {formatShortCurrency(data.income)}
                    </span>
                    <span className="text-[#F9C51C] font-medium">
                      Keluar: {formatShortCurrency(data.expense)}
                    </span>
                  </div>

                  <div className="w-full flex justify-center items-end h-full gap-[1px] md:gap-1">
                    <div
                      className="w-1/2 max-w-[16px] md:max-w-[24px] bg-green-400 group-hover:bg-green-500 rounded-t-sm md:rounded-t-md transition-all duration-700 ease-out shadow-sm"
                      style={{ height: `${incHeight}%` }}
                    ></div>
                    <div
                      className="w-1/2 max-w-[16px] md:max-w-[24px] bg-[#4C5D81] group-hover:bg-[#33406C] rounded-t-sm md:rounded-t-md transition-all duration-700 ease-out shadow-sm"
                      style={{ height: `${expHeight}%` }}
                    ></div>
                  </div>

                  <span className="text-[9px] md:text-xs text-[#4C5D81] font-bold mt-2 md:mt-3 uppercase">
                    {monthNames[index]}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

const SettingsView = () => {
  const {
    wallets,
    categories,
    addWallet,
    deleteWallet,
    addCategory,
    deleteCategory,
  } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState("wallets");

  const [walletName, setWalletName] = useState("");
  const [walletType, setWalletType] = useState("Cash");
  const [walletBalance, setWalletBalance] = useState("");
  const [walletDomain, setWalletDomain] = useState(""); // STATE BARU UNTUK WEBSITE DOMAIN

  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState("Expense");

  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  const handleAddZerosToWallet = (zeros) => {
    if (!walletBalance || walletBalance === "0") return;
    setWalletBalance((prev) => prev + zeros);
  };

  const handleAddWallet = (e) => {
    e.preventDefault();
    addWallet({
      name: walletName,
      type: walletType,
      balance: parseFloat(walletBalance) || 0,
      domain: extractDomain(walletDomain), // Simpan versi bersih dari domain yang diinput
    });
    setIsWalletDialogOpen(false);
    setWalletName("");
    setWalletBalance("");
    setWalletType("Cash");
    setWalletDomain("");
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    addCategory({ name: catName, type: catType });
    setIsCategoryDialogOpen(false);
    setCatName("");
    setCatType("Expense");
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-in slide-in-from-bottom-2 space-y-4 md:space-y-6">
      <h2 className="text-xl md:text-2xl font-bold text-[#33406C]">
        Master Data
      </h2>

      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab("wallets")}
          className={`px-5 py-3 text-sm md:text-base font-bold border-b-2 transition-colors ${
            activeTab === "wallets"
              ? "border-[#33406C] text-[#33406C]"
              : "border-transparent text-[#4C5D81] hover:text-[#33406C]"
          }`}
        >
          Dompet
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`px-5 py-3 text-sm md:text-base font-bold border-b-2 transition-colors ${
            activeTab === "categories"
              ? "border-[#33406C] text-[#33406C]"
              : "border-transparent text-[#4C5D81] hover:text-[#33406C]"
          }`}
        >
          Kategori
        </button>
      </div>

      {activeTab === "wallets" && (
        <div className="space-y-3 md:space-y-4">
          <Dialog
            open={isWalletDialogOpen}
            onOpenChange={setIsWalletDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full mb-2 md:h-12 border-dashed border-2 border-[#33406C]/40 bg-white text-[#33406C] font-bold hover:bg-[#33406C]/5 hover:border-[#33406C]"
              >
                <Plus size={20} className="mr-2 text-[#33406C]" /> Tambah Dompet
                Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <form onSubmit={handleAddWallet}>
                <DialogHeader>
                  <DialogTitle>Tambah Dompet</DialogTitle>
                  <DialogDescription>
                    Masukkan detail dompet atau rekening baru Anda di sini.
                  </DialogDescription>
                </DialogHeader>
                <FieldGroup>
                  <Field>
                    <Label htmlFor="w-name">Nama Dompet</Label>
                    <Input
                      id="w-name"
                      value={walletName}
                      onChange={(e) => setWalletName(e.target.value)}
                      required
                      placeholder="Cth: BCA, OVO..."
                    />
                  </Field>
                  <Field>
                    <Label htmlFor="w-domain">
                      Website Platform (Opsional)
                    </Label>
                    <Input
                      id="w-domain"
                      value={walletDomain}
                      onChange={(e) => setWalletDomain(e.target.value)}
                      placeholder="Cth: bca.co.id, ovo.id"
                    />
                    <span className="text-[10px] text-[#4C5D81]">
                      Masukkan web platform untuk menampilkan logo otomatis.
                    </span>
                  </Field>
                  <Field>
                    <Label>Tipe</Label>
                    <Select value={walletType} onValueChange={setWalletType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Tipe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Bank">Bank</SelectItem>
                          <SelectItem value="E-Wallet">E-Wallet</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <div className="flex justify-between items-end">
                      <Label htmlFor="w-bal">Saldo Awal (Rp)</Label>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAddZerosToWallet("00")}
                          className="px-2.5 py-1.5 text-[11px] font-bold bg-slate-100 text-[#4C5D81] rounded-md hover:bg-slate-200 hover:text-[#33406C] transition-colors shadow-sm"
                        >
                          00
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddZerosToWallet("000")}
                          className="px-2.5 py-1.5 text-[11px] font-bold bg-slate-100 text-[#4C5D81] rounded-md hover:bg-slate-200 hover:text-[#33406C] transition-colors shadow-sm"
                        >
                          000
                        </button>
                      </div>
                    </div>
                    <Input
                      id="w-bal"
                      type="text"
                      inputMode="numeric"
                      value={formatNumberInput(walletBalance)}
                      onChange={(e) =>
                        setWalletBalance(parseNumberInput(e.target.value))
                      }
                      required
                      placeholder="0"
                    />
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" type="button">
                      Batal
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    className="bg-[#F9C51C] text-[#33406C] hover:bg-[#e0b018] font-bold"
                  >
                    Simpan
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {wallets.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between p-4 bg-[#4C5D81]/5 border border-[#4C5D81]/20 rounded-xl shadow-sm hover:border-[#4C5D81] transition-all group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-white rounded-md shadow-sm border border-slate-100 shrink-0">
                    <BrandIcon domain={w.domain} size={20} className="text-[#4C5D81]" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-sm md:text-base text-[#33406C] truncate">
                      {w.name}{" "}
                      <span className="text-xs font-normal text-[#4C5D81] ml-1">
                        ({w.type})
                      </span>
                    </p>
                    <p className="text-xs md:text-sm text-[#4C5D81] mt-0.5 truncate">
                      Saldo: {formatCurrency(w.balance)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="danger"
                  className="shrink-0 h-8 md:h-10 px-3 ml-2 w-auto shadow-sm"
                  onClick={() => deleteWallet(w.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "categories" && (
        <div className="space-y-3 md:space-y-4">
          <Dialog
            open={isCategoryDialogOpen}
            onOpenChange={setIsCategoryDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full mb-2 md:h-12 border-dashed border-2 border-[#33406C]/40 bg-white text-[#33406C] font-bold hover:bg-[#33406C]/5 hover:border-[#33406C]"
              >
                <Plus size={20} className="mr-2 text-[#33406C]" /> Tambah
                Kategori Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <form onSubmit={handleAddCategory}>
                <DialogHeader>
                  <DialogTitle>Tambah Kategori</DialogTitle>
                  <DialogDescription>
                    Masukkan nama kategori pengeluaran atau pemasukan baru.
                  </DialogDescription>
                </DialogHeader>
                <FieldGroup>
                  <Field>
                    <Label htmlFor="c-name">Nama Kategori</Label>
                    <Input
                      id="c-name"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      required
                      placeholder="Cth: Belanja..."
                    />
                  </Field>
                  <Field>
                    <Label>Tipe Kategori</Label>
                    <Select value={catType} onValueChange={setCatType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Tipe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="Expense">Pengeluaran</SelectItem>
                          <SelectItem value="Income">Pemasukan</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" type="button">
                      Batal
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    className="bg-[#F9C51C] text-[#33406C] hover:bg-[#e0b018] font-bold"
                  >
                    Simpan
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-4 bg-[#4C5D81]/5 border border-[#4C5D81]/20 rounded-xl shadow-sm hover:border-[#4C5D81] transition-all group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span
                    className={`shrink-0 w-3 h-3 rounded-full ${
                      c.type === "Income"
                        ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                        : "bg-[#4C5D81] shadow-[0_0_8px_rgba(76,93,129,0.5)]"
                    }`}
                  ></span>
                  <p className="font-bold text-[#33406C] text-sm md:text-base truncate">
                    {c.name}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="text-[10px] md:text-xs font-semibold text-[#4C5D81] bg-white border border-[#4C5D81]/20 px-2.5 py-1 rounded-full">
                    {c.type}
                  </span>
                  <Button
                    variant="danger"
                    className="h-8 md:h-10 px-3 w-auto shadow-sm"
                    onClick={() => deleteCategory(c.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- INTERACTIVE NAV BUTTON ---
const NavButton = ({ active, onClick, icon, label }) => {
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center justify-center rounded-full transition-all duration-300 ease-out h-12 md:h-14
        ${
          active
            ? "bg-[#33406C] text-[#F9C51C] px-4 md:px-5 shadow-sm"
            : "text-[#4C5D81] hover:bg-slate-100 hover:text-[#33406C] px-3 md:px-4 hover:px-4 md:hover:px-5"
        }
      `}
    >
      <div className="shrink-0 scale-100 md:scale-110">{icon}</div>
      <div
        className={`grid transition-all duration-300 ease-out
        ${
          active
            ? "grid-cols-[1fr] opacity-100 ml-2"
            : "grid-cols-[0fr] opacity-0 group-hover:grid-cols-[1fr] group-hover:opacity-100 group-hover:ml-2"
        }
      `}
      >
        <span className="overflow-hidden whitespace-nowrap text-sm md:text-base font-bold tracking-wide">
          {label}
        </span>
      </div>
    </button>
  );
};

// --- LAYAR LOADING ---
const LoadingScreen = () => (
  <div className="absolute inset-0 bg-[#f8f9fa] z-[200] flex flex-col items-center justify-center">
    <Loader2 className="h-12 w-12 text-[#F9C51C] animate-spin mb-4" />
    <h2 className="text-xl font-bold text-[#33406C] mb-2">Memproses data...</h2>
    <p className="text-[#4C5D81] text-sm text-center px-6">
      Harap menunggu, mengambil data dari Spreadsheet.
    </p>
  </div>
);

// --- PWA INSTALL PROMPT ---
const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Event ini hanya akan dipicu oleh browser (khususnya Android Chrome) 
    // JIKA web Anda memiliki manifest.json dan service worker yang valid.
    const handler = (e) => {
      // Cegah mini-infobar bawaan Chrome agar tidak muncul
      e.preventDefault();
      // Simpan event agar bisa dipicu nanti saat tombol diklik
      setDeferredPrompt(e);
      // Tampilkan popup custom kita
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Sembunyikan popup jika user berhasil menginstal dari menu browser
    window.addEventListener("appinstalled", () => {
      setShowPrompt(false);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Munculkan prompt install bawaan Android
      deferredPrompt.prompt();
      // Tunggu respons user
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="absolute bottom-28 left-4 right-4 md:bottom-10 md:left-8 md:right-auto md:w-80 bg-white p-4 rounded-2xl shadow-[0_15px_50px_rgba(51,64,108,0.25)] border border-slate-100 z-[150] animate-in slide-in-from-bottom-4 flex items-center gap-3">
      <div className="shrink-0">
        <img 
          src="/logo.png" 
          alt="App Logo" 
          className="w-12 h-12 rounded-xl object-contain bg-slate-50 border border-slate-100 p-0.5" 
          onError={(e) => {
            // Fallback jika logo.png tidak ditemukan
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div className="hidden w-12 h-12 rounded-xl bg-[#33406C] items-center justify-center text-[#F9C51C]">
          <Wallet size={24} />
        </div>
      </div>
      
      <div className="flex-1">
        <h4 className="font-bold text-sm text-[#33406C]">Install Money Talks</h4>
        <p className="text-[10px] md:text-xs text-[#4C5D81] leading-tight mt-0.5">
          Tambahkan ke layar utama agar lebih cepat diakses.
        </p>
      </div>
      
      <div className="flex flex-col gap-1.5 shrink-0">
        <button 
          onClick={handleInstall} 
          className="bg-[#F9C51C] text-[#33406C] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#e0b018] transition-colors"
        >
          Install
        </button>
        <button 
          onClick={() => setShowPrompt(false)} 
          className="bg-slate-100 text-[#4C5D81] text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
        >
          Nanti
        </button>
      </div>
    </div>
  );
};

// --- MAIN LAYOUT ---
const AppContent = () => {
  const [currentView, setCurrentView] = useState("dashboard");
  const { isLoading } = useContext(AppContext);

  useEffect(() => {
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement("meta");
      viewportMeta.name = "viewport";
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.content =
      "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0";
  }, []);

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardView />;
      case "transaction":
        return <TransactionFormView />;
      case "history":
        return <HistoryView />;
      case "recap":
        return <RecapView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-slate-100 flex justify-center items-center font-sans md:p-6 lg:p-10 text-[#33406C]">
      <div className="w-full max-w-full md:max-w-4xl lg:max-w-5xl bg-white relative flex flex-col shadow-2xl h-[100dvh] md:h-[90vh] md:rounded-3xl overflow-hidden md:border border-slate-200">
        {/* TAMPILAN LOADING JIKA MASIH FETCHING DATA */}
        {isLoading && <LoadingScreen />}
        
        {/* POPUP INSTALL PWA (Hanya muncul di Android/Chrome yang mendukung) */}
        <InstallPrompt />

        <header className="bg-white/90 backdrop-blur-md px-6 md:px-10 py-4 md:py-6 border-b border-slate-100 sticky top-0 z-[100] flex justify-between items-center w-full">
          <h1 className="text-xl md:text-2xl font-black flex items-center gap-3 text-[#33406C] tracking-tight">
            {/* ==============================================
                GANTI LOGO ANDA DI BAWAH SINI
                Hapus elemen <Wallet.../> dan ganti dengan tag <img> 
                atau komponen SVG Logo Anda sendiri.
               ============================================== */}
            <span className="bg-[#33406C] text-[#F9C51C] p-2 md:p-2.5 rounded-lg md:rounded-xl shadow-md flex items-center justify-center">
              <img src="/logo.svg" alt="Logo" className="w-6 h-6 md:w-7 md:h-7 object-contain" />
            </span>
            {/* ============================================== */}
            Money Talks
          </h1>

          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden md:inline-flex text-xs font-bold text-[#4C5D81] bg-slate-100 px-3 py-1.5 rounded-full items-center tracking-wide">
              Personal Finance
            </span>
            <FloatingCalculator />
          </div>
        </header>

        <main className="flex-1 w-full overflow-y-auto p-4 sm:p-6 md:p-10 pb-32 md:pb-40 overflow-x-hidden relative z-0">
          {!isLoading && renderView()}
        </main>

        <div className="absolute bottom-6 md:bottom-8 left-0 right-0 flex justify-center pointer-events-none z-[60] w-full px-4">
          <nav className="pointer-events-auto flex items-center p-1.5 md:p-2 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-full shadow-[0_8px_40px_rgba(51,64,108,0.15)] transition-all duration-500 ease-out hover:bg-white hover:shadow-[0_12px_50px_rgba(51,64,108,0.2)] hover:scale-[1.02] active:bg-white active:scale-100 max-w-full overflow-x-auto no-scrollbar">
            <NavButton
              active={currentView === "dashboard"}
              onClick={() => setCurrentView("dashboard")}
              icon={<Home size={22} />}
              label="Home"
            />
            <NavButton
              active={currentView === "history"}
              onClick={() => setCurrentView("history")}
              icon={<History size={22} />}
              label="History"
            />

            <div className="px-1.5 md:px-2 relative shrink-0">
              <button
                onClick={() =>
                  setCurrentView(
                    currentView === "transaction" ? "dashboard" : "transaction"
                  )
                }
                className={`flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full shadow-lg transition-all duration-300 z-10 hover:scale-110 active:scale-95 ${
                  currentView === "transaction"
                    ? "bg-[#4C5D81] text-white rotate-90 shadow-[0_4px_20px_rgba(76,93,129,0.4)]"
                    : "bg-[#F9C51C] text-[#33406C] hover:bg-[#e0b018] shadow-[0_4px_20px_rgba(249,197,28,0.4)]"
                }`}
              >
                {currentView === "transaction" ? (
                  <X
                    size={24}
                    className="-rotate-90 transition-transform duration-300"
                  />
                ) : (
                  <Plus size={26} strokeWidth={2.5} />
                )}
              </button>
            </div>

            <NavButton
              active={currentView === "recap"}
              onClick={() => setCurrentView("recap")}
              icon={<BarChart3 size={22} />}
              label="Rekap"
            />
            <NavButton
              active={currentView === "settings"}
              onClick={() => setCurrentView("settings")}
              icon={<Settings size={22} />}
              label="Settings"
            />
          </nav>
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;
