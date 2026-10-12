import Link from "next/link";
export default function AdminUnavailable() {
 return <main style={{minHeight:"80vh",display:"grid",placeItems:"center",padding:24}}><section style={{maxWidth:480,textAlign:"center"}}><h1>Admin connection unavailable</h1><p>We could not verify your owner session because the store database could not be reached. Please retry shortly.</p><Link href="/admin">Retry admin dashboard</Link></section></main>;
}
