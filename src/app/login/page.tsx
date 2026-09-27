import { login } from "../actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <form action={login} className="mt-10 space-y-3">
      <label className="label" htmlFor="password">비밀번호</label>
      <input id="password" name="password" type="password" className="input" autoFocus />
      {error && <p className="text-sm text-red-600">비밀번호가 틀렸습니다.</p>}
      <button className="btn w-full">로그인</button>
    </form>
  );
}
