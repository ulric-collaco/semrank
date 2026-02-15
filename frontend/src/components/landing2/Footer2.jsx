
export default function Footer2() {
    return (
        <footer className="bg-black border-t border-green-900/30 py-12 px-6 font-mono text-green-500/60 text-xs">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-2">
                    <h4 className="text-green-400 font-bold mb-4 uppercase tracking-widest text-lg">[ SemRank_System ]</h4>
                    <p className="max-w-md mb-4 font-light">
                        Secure academic tracking protocol. Unauthorized access is prohibited. All data is encrypted and monitored.
                    </p>
                    <div className="flex items-center gap-2 text-green-700">
                        <span className="w-2 h-2 bg-green-700 rounded-full"></span>
                        System Operational
                    </div>
                </div>

                <div>
                    <h4 className="text-green-400 font-bold mb-4 uppercase tracking-widest">[ Links ]</h4>
                    <ul className="space-y-2">
                        <li><a href="#" className="hover:text-green-300 hover:ml-1 transition-all">> Index</a></li>
                        <li><a href="#" className="hover:text-green-300 hover:ml-1 transition-all">> Database</a></li>
                        <li><a href="#" className="hover:text-green-300 hover:ml-1 transition-all">> Matrix</a></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-green-400 font-bold mb-4 uppercase tracking-widest">[ Developer ]</h4>
                    <ul className="space-y-2">
                        <li><a href="https://ulriccollaco.me" target="_blank" className="hover:text-green-300 hover:ml-1 transition-all border-b border-green-900 pb-1">> Ulric Collaco</a></li>
                        <li className="pt-2 opacity-50">Loc: 127.0.0.1</li>
                    </ul>
                </div>
            </div>
            <div className="mt-12 text-center border-t border-green-900/20 pt-8 opacity-40">
                © 2026 SEMRANK. EXECUTION COMPLETE.
            </div>
        </footer>
    );
}
