<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'nom' => 'NomTest',
            'prenom' => 'PrenomTest',
            'email' => 'test@example.com',
            'password' => bcrypt('password1234'), // N'oublie pas les 12 caractères pour ta collègue !
            'role' => 'apprenant',
        ]);
    }
}
