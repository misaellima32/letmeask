import { FormEvent, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import logoImg from '../assets/images/logo.svg'
import { Button } from '../components/Button'
import { Question } from '../components/Question'
import { RoomCode } from '../components/RoomCode'
import { useAuth } from '../hooks/useAuth'
import { database } from '../services/firebase'
import '../styles/room.scss'

type RoomParams = {
  id: string;
}
type FirebaseQuestions = Record<string, {
  author: {
    name: string,
    avatar: string,
  }
  content: string,
  isAnswered: boolean,
  isHighlighted: boolean,
}>
type Questions = {
  id: string,
  author: {
    name: string,
    avatar: string,
  }
  content: string,
  isAnswered: boolean,
  isHighlighted: boolean
}


export function Room() {

  const { user } = useAuth();
  const params = useParams<RoomParams>();
  const roomId = params.id
  const [newQuestion, setNewQuestion] = useState('') 
  const [questions, setQuestions] = useState<Questions[]>([])
  const [title, setTitle] = useState('') 

  useEffect(() => {
    const roomRef = database.ref(`rooms/${roomId}`)

    roomRef.on('value', room => {
      const databaseRoom = room.val();
      const firebaseQuestions: FirebaseQuestions = databaseRoom.questions ?? {}
      const parsedQuestions = Object.entries(firebaseQuestions).map(([key, value]) => {
        return {
          id: key,
          content: value.content,
          author: value.author,
          isHighlighted: value.isHighlighted,
          isAnswered: value.isAnswered
        }
      })
      setTitle(databaseRoom.title)
      setQuestions(parsedQuestions)
    })
  }, [roomId])

  async function handleCreateSendQuestion(event: FormEvent) {
    event.preventDefault();

    if (newQuestion.trim() === '') {
      return
    }
    
    if (!user) {
      throw new Error('You must be logged')
    }

    const question = {
      content: newQuestion,
      author: {
        name: user.name,
        avatar: user.avatar,
      },
      isHighlighted: false,
      isAnswered: false
    }

    await database.ref(`rooms/${roomId}/questions`).push(question);

    setNewQuestion('');
  }

  return (
    <div id="page-room">
      <header>
        <div className="content">
          <img src={logoImg} alt="Letmeask" />
          <RoomCode code={roomId} />
        </div>
      </header>
      <main className='content'>
        <div className='room-title'>
          <h1>Sala {title}</h1>
          { questions.length > 0 && <span>{questions.length} {questions.length > 1 ? 'Perguntas' : 'Pergunta'}</span>}
        </div>
        <form onSubmit={handleCreateSendQuestion}>
          <textarea 
            placeholder='O que você quer perguntar?'
            onChange={event => setNewQuestion(event.target.value)}
            value={newQuestion}
          ></textarea>
          <div className="form-footer">
            { user ? (
              <div className='user-info'>
                <img src={user.avatar} alt={user.name} />
                <span>{user.name}</span>
              </div>
            ) : (
              <span>Para enviar uma perguntar, <button>faça seu login</button>.</span>
            )}
            
            <Button type='submit' disabled={!user}>Enviar Perguntar</Button>
          </div>
        </form>
        <div className="question-list">
          {questions.map(question => {
            return(
              <Question
                key={question.id}
                content={question.content}
                author={question.author}
              />
            )
          })}
        </div>
      </main>
    </div>
  )
}