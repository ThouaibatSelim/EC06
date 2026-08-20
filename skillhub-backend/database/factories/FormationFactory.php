<?php

namespace Database\Factories;

use App\Models\Formation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class FormationFactory extends Factory
{
    protected $model = Formation::class;

    public function definition(): array
    {
        return [
            'titre'        => fake()->sentence(4),
            'description'  => fake()->paragraph(),
            'categorie'    => fake()->randomElement([
                'Développement web', 'Data & IA', 'Design', 'Marketing', 'DevOps'
            ]),
            'niveau'       => fake()->randomElement([
                'Débutant', 'Intermédiaire', 'Avancé'
            ]),
            'formateur_id' => User::factory()->formateur(),
            'nombre_vues'  => 0,
        ];
    }
}