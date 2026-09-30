import { prisma } from "@project/db";
import { createStudent } from "@project/domain";
export async function POST(request: Request) {
    try{
        const body = await request.json();

        const student = await createStudent(body.email, body.passwordHash);

        return new Response(JSON.stringify(student), { status: 201 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to create student" }), { status: 500 });
    }
}