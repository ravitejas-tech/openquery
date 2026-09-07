/**
 * Everything below imports from `./api`, which QueryFish generated from
 * `openapi.yaml`. Nothing here is hand-written against the API surface.
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useListPets, useGetPet } from './api/queries';
import { useCreatePet, useDeletePet } from './api/mutations';

export function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // `variables` is fully typed from the spec: `status` only accepts
  // 'available' | 'pending' | 'sold', and a typo is a compile error.
  const pets = useListPets({
    variables: { status: 'available' },
  });

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 720 }}>
      <h1>Petstore</h1>

      {pets.isPending && <p>Loading…</p>}
      {pets.isError && <p role="alert">Failed to load: {pets.error.message}</p>}

      <ul>
        {pets.data?.map((pet) => (
          <li key={pet.id}>
            <button onClick={() => setSelectedId(pet.id)}>{pet.name}</button>
            {pet.tag && <span> — {pet.tag}</span>}
          </li>
        ))}
      </ul>

      {selectedId && <PetDetail petId={selectedId} />}

      <CreatePetForm />
    </main>
  );
}

function PetDetail({ petId }: { petId: string }) {
  // Path parameters are required by the generated type — omitting `petId`
  // would not compile.
  const pet = useGetPet({ variables: { petId } });
  const queryClient = useQueryClient();

  const remove = useDeletePet({
    onSuccess: () => {
      // Path-segment query keys make prefix invalidation work: this clears
      // every ['pets', …] query at once.
      void queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
  });

  if (pet.isPending) return <p>Loading pet…</p>;
  if (pet.isError) return <p role="alert">{pet.error.message}</p>;

  return (
    <section>
      <h2>{pet.data.name}</h2>
      <dl>
        <dt>ID</dt>
        <dd>{pet.data.id}</dd>
        {pet.data.status && (
          <>
            <dt>Status</dt>
            <dd>{pet.data.status}</dd>
          </>
        )}
        {pet.data.owner && (
          <>
            <dt>Owner</dt>
            <dd>{pet.data.owner.name ?? pet.data.owner.id}</dd>
          </>
        )}
      </dl>

      <button onClick={() => remove.mutate({ petId })} disabled={remove.isPending}>
        {remove.isPending ? 'Deleting…' : 'Delete'}
      </button>
    </section>
  );
}

function CreatePetForm() {
  const [name, setName] = useState('');
  const queryClient = useQueryClient();

  const create = useCreatePet({
    onSuccess: () => {
      setName('');
      void queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        // The request body is typed from the spec's schema.
        create.mutate({ body: { name } });
      }}
    >
      <h2>Add a pet</h2>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Name"
        required
      />
      <button type="submit" disabled={create.isPending || !name}>
        {create.isPending ? 'Saving…' : 'Create'}
      </button>
      {create.isError && <p role="alert">{create.error.message}</p>}
    </form>
  );
}
